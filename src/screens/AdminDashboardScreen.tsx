import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { auth, db } from '../config/firebase';

export default function AdminDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const [totalUsers, setTotalUsers] = useState(0);
  const [donantes, setDonantes] = useState(0);
  const [receptores, setReceptores] = useState(0);
  const [validadores, setValidadores] = useState(0);
  const [admins, setAdmins] = useState(0);

  const [pendingValidators, setPendingValidators] = useState<any[]>([]);
  const [authorizedValidators, setAuthorizedValidators] = useState(0);
  const [rejectedValidators, setRejectedValidators] = useState(0);

  const [totalMedicines, setTotalMedicines] = useState(0);
  const [publishedMedicines, setPublishedMedicines] = useState(0);
  const [depletedMedicines, setDepletedMedicines] = useState(0);
  const [pendingValidationMedicines, setPendingValidationMedicines] = useState(0);
  const [validatedMedicines, setValidatedMedicines] = useState(0);

  const [totalRequests, setTotalRequests] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [approvedRequests, setApprovedRequests] = useState(0);
  const [rejectedRequests, setRejectedRequests] = useState(0);
  const [deliveredRequests, setDeliveredRequests] = useState(0);

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      const validators = users.filter((user: any) => user.role === 'validador');

      const getTimestampMillis = (value: any) => {
        if (value?.toDate) {
          return value.toDate().getTime();
        }

        if (value instanceof Date) {
          return value.getTime();
        }

        return 0;
      };

      const pending = validators
        .filter(
          (user: any) =>
            user.validatorAuthorized !== true &&
            user.validatorStatus === 'pendiente'
        )
        .sort((a: any, b: any) => {
          const dateA = getTimestampMillis(a.createdAt);
          const dateB = getTimestampMillis(b.createdAt);

          return dateB - dateA;
        });

      const authorized = validators.filter(
        (user: any) =>
          user.validatorAuthorized === true &&
          user.validatorStatus === 'autorizado'
      );

      const rejected = validators.filter(
        (user: any) => user.validatorStatus === 'rechazado'
      );

      setTotalUsers(users.length);
      setDonantes(users.filter((user: any) => user.role === 'donante').length);
      setReceptores(users.filter((user: any) => user.role === 'receptor').length);
      setValidadores(validators.length);
      setAdmins(users.filter((user: any) => user.role === 'admin').length);

      setPendingValidators(pending);
      setAuthorizedValidators(authorized.length);
      setRejectedValidators(rejected.length);

      setLoading(false);
    });

    const unsubscribeMedicines = onSnapshot(collection(db, 'medicines'), (snapshot) => {
      const medicines = snapshot.docs.map((docItem) => docItem.data());

      setTotalMedicines(medicines.length);
      setPublishedMedicines(
        medicines.filter((item: any) => item.donationStatus === 'publicado').length
      );
      setDepletedMedicines(
        medicines.filter((item: any) => item.donationStatus === 'agotado').length
      );
      setPendingValidationMedicines(
        medicines.filter((item: any) => item.validationStatus === 'pendiente').length
      );
      setValidatedMedicines(
        medicines.filter((item: any) => item.validationStatus === 'validado').length
      );

      setLoading(false);
    });

    const unsubscribeRequests = onSnapshot(collection(db, 'requests'), (snapshot) => {
      const requests = snapshot.docs.map((docItem) => docItem.data());

      setTotalRequests(requests.length);
      setPendingRequests(
        requests.filter((item: any) => item.status === 'pendiente').length
      );
      setApprovedRequests(
        requests.filter((item: any) => item.status === 'aprobado').length
      );
      setRejectedRequests(
        requests.filter((item: any) => item.status === 'rechazado').length
      );
      setDeliveredRequests(
        requests.filter((item: any) => item.status === 'entregado').length
      );

      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeMedicines();
      unsubscribeRequests();
    };
  }, []);

  const authorizeValidator = (validator: any) => {
    Alert.alert(
      'Autorizar validador',
      `¿Deseas certificar a ${validator.fullName || 'este usuario'} como validador autorizado?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Autorizar',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'users', validator.id), {
                validatorAuthorized: true,
                validatorStatus: 'autorizado',
                validatorAuthorizedAt: new Date(),
                validatorAuthorizedBy: auth.currentUser?.uid || null,
                validatorRejectedAt: null,
                validatorRejectedBy: null,
              });

              Alert.alert(
                'Validador autorizado',
                'El usuario ya puede revisar solicitudes y escanear códigos QR.'
              );
            } catch (error) {
              console.log(error);
              Alert.alert('Error', 'No se pudo autorizar al validador.');
            }
          },
        },
      ]
    );
  };

  const rejectValidator = (validator: any) => {
    Alert.alert(
      'Rechazar validador',
      `¿Deseas rechazar la autorización de ${validator.fullName || 'este usuario'}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'users', validator.id), {
                validatorAuthorized: false,
                validatorStatus: 'rechazado',
                validatorRejectedAt: new Date(),
                validatorRejectedBy: auth.currentUser?.uid || null,
                validatorAuthorizedAt: null,
                validatorAuthorizedBy: null,
              });

              Alert.alert(
                'Validador rechazado',
                'El usuario no podrá aprobar solicitudes ni escanear códigos QR.'
              );
            } catch (error) {
              console.log(error);
              Alert.alert('Error', 'No se pudo rechazar al validador.');
            }
          },
        },
      ]
    );
  };

  const buildRows = (rows: { label: string; value: number }[]) => {
    return rows
      .map((row) => `<tr><td>${row.label}</td><td>${row.value}</td></tr>`)
      .join('');
  };

  const generateReportHtml = (
    reportTitle: string,
    reportSubtitle: string,
    sections: { title: string; rows: { label: string; value: number }[] }[]
  ) => {
    const currentDate = new Date().toLocaleString();

    return `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 28px;
              color: #1F3D2B;
              background: #ffffff;
            }

            .header {
              background: #DCFCE7;
              border: 1px solid #BBF7D0;
              border-radius: 14px;
              padding: 18px;
              margin-bottom: 22px;
            }

            h1 {
              color: #1F4D36;
              margin: 0 0 6px 0;
              font-size: 26px;
            }

            .subtitle {
              color: #4F6F5D;
              font-size: 14px;
              margin: 0;
              line-height: 20px;
            }

            h2 {
              color: #24513A;
              font-size: 18px;
              margin-top: 24px;
              border-bottom: 2px solid #D8EBDD;
              padding-bottom: 6px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              margin-bottom: 18px;
            }

            th {
              background: #2E7D4F;
              color: white;
              text-align: left;
              padding: 10px;
              font-size: 13px;
            }

            td {
              border: 1px solid #D8EBDD;
              padding: 10px;
              font-size: 13px;
            }

            .footer {
              margin-top: 28px;
              padding: 12px;
              background: #F1F8F4;
              border-radius: 10px;
              font-size: 12px;
              color: #4F6F5D;
            }
          </style>
        </head>

        <body>
          <div class="header">
            <h1>${reportTitle}</h1>
            <p class="subtitle">Generado el: ${currentDate}</p>
            <p class="subtitle">${reportSubtitle}</p>
          </div>

          ${sections
            .map(
              (section) => `
                <h2>${section.title}</h2>
                <table>
                  <tr>
                    <th>Indicador</th>
                    <th>Total</th>
                  </tr>
                  ${buildRows(section.rows)}
                </table>
              `
            )
            .join('')}

          <div class="footer">
            Reporte generado desde el módulo administrativo de MediConnect.
            Su finalidad es apoyar la supervisión, trazabilidad y toma de decisiones del sistema.
          </div>
        </body>
      </html>
    `;
  };

  const getReportData = (type: 'general' | 'medicamentos' | 'solicitudes' | 'validadores') => {
    if (type === 'medicamentos') {
      return {
        title: 'Reporte de medicamentos - MediConnect',
        subtitle: 'Resumen del inventario crítico registrado en la plataforma.',
        sections: [
          {
            title: 'Medicamentos',
            rows: [
              { label: 'Medicamentos registrados', value: totalMedicines },
              { label: 'Medicamentos publicados', value: publishedMedicines },
              { label: 'Medicamentos agotados', value: depletedMedicines },
              { label: 'Pendientes de validación', value: pendingValidationMedicines },
              { label: 'Medicamentos validados', value: validatedMedicines },
            ],
          },
        ],
      };
    }

    if (type === 'solicitudes') {
      return {
        title: 'Reporte de solicitudes - MediConnect',
        subtitle: 'Resumen del flujo de solicitudes de donación.',
        sections: [
          {
            title: 'Solicitudes',
            rows: [
              { label: 'Solicitudes registradas', value: totalRequests },
              { label: 'Solicitudes pendientes', value: pendingRequests },
              { label: 'Solicitudes aprobadas', value: approvedRequests },
              { label: 'Solicitudes rechazadas', value: rejectedRequests },
              { label: 'Solicitudes entregadas', value: deliveredRequests },
            ],
          },
        ],
      };
    }

    if (type === 'validadores') {
      return {
        title: 'Reporte de validadores - MediConnect',
        subtitle: 'Resumen de certificación y control de validadores.',
        sections: [
          {
            title: 'Validadores',
            rows: [
              { label: 'Validadores registrados', value: validadores },
              { label: 'Validadores autorizados', value: authorizedValidators },
              { label: 'Validadores pendientes', value: pendingValidators.length },
              { label: 'Validadores rechazados', value: rejectedValidators },
            ],
          },
        ],
      };
    }

    return {
      title: 'Reporte general - MediConnect',
      subtitle: 'Resumen general de usuarios, medicamentos, solicitudes y validadores.',
      sections: [
        {
          title: 'Usuarios registrados',
          rows: [
            { label: 'Usuarios registrados', value: totalUsers },
            { label: 'Donantes', value: donantes },
            { label: 'Receptores', value: receptores },
            { label: 'Validadores', value: validadores },
            { label: 'Validadores autorizados', value: authorizedValidators },
            { label: 'Validadores pendientes', value: pendingValidators.length },
            { label: 'Validadores rechazados', value: rejectedValidators },
            { label: 'Administradores', value: admins },
          ],
        },
        {
          title: 'Medicamentos',
          rows: [
            { label: 'Medicamentos registrados', value: totalMedicines },
            { label: 'Medicamentos publicados', value: publishedMedicines },
            { label: 'Medicamentos agotados', value: depletedMedicines },
            { label: 'Pendientes de validación', value: pendingValidationMedicines },
            { label: 'Medicamentos validados', value: validatedMedicines },
          ],
        },
        {
          title: 'Solicitudes',
          rows: [
            { label: 'Solicitudes registradas', value: totalRequests },
            { label: 'Solicitudes pendientes', value: pendingRequests },
            { label: 'Solicitudes aprobadas', value: approvedRequests },
            { label: 'Solicitudes rechazadas', value: rejectedRequests },
            { label: 'Solicitudes entregadas', value: deliveredRequests },
          ],
        },
      ],
    };
  };

  const generatePdfReport = async (
    type: 'general' | 'medicamentos' | 'solicitudes' | 'validadores'
  ) => {
    try {
      if (generatingPdf) return;

      setGeneratingPdf(true);

      const report = getReportData(type);
      const html = generateReportHtml(report.title, report.subtitle, report.sections);

      const file = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        Alert.alert('PDF generado', `Archivo creado en: ${file.uri}`);
        return;
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir reporte administrativo',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo generar el PDF.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const StatCard = ({
    title,
    value,
    description,
  }: {
    title: string;
    value: number;
    description: string;
  }) => (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.statTextBox}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statDescription}>{description}</Text>
      </View>
    </View>
  );

  const SectionHeader = ({
    title,
    showDot = false,
  }: {
    title: string;
    showDot?: boolean;
  }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {showDot && <View style={styles.redDot} />}
    </View>
  );

  const ReportButton = ({
    title,
    onPress,
  }: {
    title: string;
    onPress: () => void;
  }) => (
    <Pressable
      style={[styles.reportButton, generatingPdf && styles.disabledButton]}
      onPress={onPress}
      disabled={generatingPdf}
    >
      {generatingPdf ? (
        <ActivityIndicator color="#064E3B" />
      ) : (
        <Text style={styles.reportButtonText}>{title}</Text>
      )}
    </Pressable>
  );

  const PendingValidatorCard = ({ validator }: { validator: any }) => (
    <View style={styles.validatorCard}>
      <Text style={styles.validatorName}>
        {validator.fullName || 'Validador sin nombre'}
      </Text>

      <Text style={styles.validatorInfo}>
        Correo: {validator.email || 'No registrado'}
      </Text>

      <Text style={styles.validatorInfo}>
        Teléfono: {validator.phone || 'No registrado'}
      </Text>

      <Text style={styles.validatorInfo}>
        Institución: {validator.institution || 'No registrada'}
      </Text>

      <Text style={styles.validatorInfo}>
        Tipo: {validator.validatorType || 'No registrado'}
      </Text>

      <Text style={styles.validatorStatus}>
        Estado: {validator.validatorStatus || 'pendiente'}
      </Text>

      <Pressable
        style={styles.authorizeButton}
        onPress={() => authorizeValidator(validator)}
      >
        <Text style={styles.authorizeButtonText}>Autorizar validador</Text>
      </Pressable>

      <Pressable
        style={styles.rejectButton}
        onPress={() => rejectValidator(validator)}
      >
        <Text style={styles.rejectButtonText}>Rechazar validador</Text>
      </Pressable>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Cargando reportes...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.title}>Panel administrativo</Text>
            <Text style={styles.subtitle}>
              Reportes, validadores y control general de MediConnect.
            </Text>
          </View>

          {pendingValidators.length > 0 && (
            <View style={styles.notificationBadge}>
              <View style={styles.notificationDot} />
              <Text style={styles.notificationText}>
                {pendingValidators.length}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{totalUsers}</Text>
          <Text style={styles.summaryLabel}>Usuarios</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{totalMedicines}</Text>
          <Text style={styles.summaryLabel}>Medicamentos</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{totalRequests}</Text>
          <Text style={styles.summaryLabel}>Solicitudes</Text>
        </View>
      </View>

      <SectionHeader title="Reportes PDF" />

      <View style={styles.reportGrid}>
        <ReportButton
          title="Reporte general"
          onPress={() => generatePdfReport('general')}
        />

        <ReportButton
          title="Medicamentos"
          onPress={() => generatePdfReport('medicamentos')}
        />

        <ReportButton
          title="Solicitudes"
          onPress={() => generatePdfReport('solicitudes')}
        />

        <ReportButton
          title="Validadores"
          onPress={() => generatePdfReport('validadores')}
        />
      </View>

      <SectionHeader
        title="Validadores pendientes"
        showDot={pendingValidators.length > 0}
      />

      {pendingValidators.length === 0 ? (
        <View style={styles.emptyValidatorBox}>
          <Text style={styles.emptyValidatorText}>
            No hay validadores pendientes de autorización.
          </Text>
        </View>
      ) : (
        pendingValidators.map((validator) => (
          <PendingValidatorCard key={validator.id} validator={validator} />
        ))
      )}

      <SectionHeader title="Usuarios registrados" />

      <StatCard
        title="Donantes"
        value={donantes}
        description="Personas o farmacias que publican medicamentos."
      />
      <StatCard
        title="Receptores"
        value={receptores}
        description="Pacientes, ONG o centros de salud que solicitan medicamentos."
      />
      <StatCard
        title="Validadores"
        value={validadores}
        description="Total de usuarios registrados como validadores."
      />
      <StatCard
        title="Validadores autorizados"
        value={authorizedValidators}
        description="Validadores certificados por un administrador."
      />
      <StatCard
        title="Validadores pendientes"
        value={pendingValidators.length}
        description="Validadores que todavía requieren autorización."
      />
      <StatCard
        title="Validadores rechazados"
        value={rejectedValidators}
        description="Validadores que no fueron autorizados."
      />
      <StatCard
        title="Administradores"
        value={admins}
        description="Usuarios con acceso a reportes administrativos."
      />

      <SectionHeader title="Medicamentos" />

      <StatCard
        title="Publicados"
        value={publishedMedicines}
        description="Medicamentos visibles para los receptores."
      />
      <StatCard
        title="Agotados"
        value={depletedMedicines}
        description="Medicamentos sin cantidad disponible."
      />
      <StatCard
        title="Pendientes de validación"
        value={pendingValidationMedicines}
        description="Medicamentos o donaciones que aún requieren revisión."
      />
      <StatCard
        title="Validados"
        value={validatedMedicines}
        description="Medicamentos revisados y aprobados."
      />

      <SectionHeader title="Solicitudes" />

      <StatCard
        title="Pendientes"
        value={pendingRequests}
        description="Solicitudes esperando revisión del validador."
      />
      <StatCard
        title="Aprobadas"
        value={approvedRequests}
        description="Solicitudes autorizadas por un validador."
      />
      <StatCard
        title="Rechazadas"
        value={rejectedRequests}
        description="Solicitudes rechazadas con observación."
      />
      <StatCard
        title="Entregadas"
        value={deliveredRequests}
        description="Solicitudes confirmadas como recibidas."
      />

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Módulo administrativo</Text>
        <Text style={styles.infoText}>
          Este módulo permite visualizar resultados generales, generar reportes,
          autorizar o rechazar validadores y apoyar la toma de decisiones del sistema.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F1F8F4',
    padding: 20,
  },
  center: {
    flex: 1,
    backgroundColor: '#F1F8F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#4F6F5D',
  },
  heroCard: {
    backgroundColor: '#1F4D36',
    borderRadius: 24,
    padding: 20,
    marginTop: 18,
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#DCFCE7',
    lineHeight: 21,
  },
  notificationBadge: {
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 8,
  },
  notificationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DC2626',
    position: 'absolute',
    top: -1,
    right: -1,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationText: {
    color: '#1F4D36',
    fontWeight: '900',
    fontSize: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D8EBDD',
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2E7D4F',
  },
  summaryLabel: {
    color: '#4F6F5D',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionHeader: {
    marginTop: 6,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#24513A',
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
  },
  reportGrid: {
    gap: 10,
    marginBottom: 16,
  },
  reportButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#D8EBDD',
  },
  reportButtonText: {
    color: '#1F4D36',
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 15,
  },
  disabledButton: {
    opacity: 0.7,
  },
  validatorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D8EBDD',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 7,
    elevation: 2,
  },
  validatorName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1F4D36',
    marginBottom: 8,
  },
  validatorInfo: {
    color: '#4F6F5D',
    fontSize: 14,
    lineHeight: 20,
  },
  validatorStatus: {
    marginTop: 8,
    color: '#854D0E',
    fontWeight: '900',
  },
  authorizeButton: {
    backgroundColor: '#2E7D4F',
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 12,
  },
  authorizeButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 15,
  },
  rejectButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginTop: 9,
  },
  rejectButtonText: {
    color: '#991B1B',
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 15,
  },
  emptyValidatorBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D8EBDD',
    marginBottom: 16,
  },
  emptyValidatorText: {
    color: '#4F6F5D',
    textAlign: 'center',
    lineHeight: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D8EBDD',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 7,
    elevation: 2,
  },
  statValue: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    color: '#166534',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 24,
    fontWeight: '900',
    marginRight: 14,
    overflow: 'hidden',
  },
  statTextBox: {
    flex: 1,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1F4D36',
    marginBottom: 3,
  },
  statDescription: {
    color: '#4F6F5D',
    fontSize: 13,
    lineHeight: 19,
  },
  infoBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  infoTitle: {
    color: '#166534',
    fontWeight: '900',
    marginBottom: 4,
  },
  infoText: {
    color: '#166534',
    lineHeight: 20,
  },
});