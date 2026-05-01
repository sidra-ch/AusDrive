import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import {
  ShieldCheck,
  Clock,
  XCircle,
  Upload,
  Camera,
  ChevronRight,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store/useAuthStore';
import { kycAPI } from '@/services/api';
import type { KycStatus } from '@src/types';

interface DocState {
  license_front: string | null;
  license_back: string | null;
  selfie: string | null;
}

export default function KycScreen() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [status, setStatus] = useState<KycStatus>('not_submitted');
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocState>({
    license_front: null,
    license_back: null,
    selfie: null,
  });

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const fetchKycStatus = async () => {
    try {
      const res = await kycAPI.getStatus();
      setStatus(res.data.status ?? 'not_submitted');
    } catch {
      setStatus('not_submitted');
    } finally {
      setLoadingStatus(false);
    }
  };

  const pickAndUpload = async (docType: keyof DocState) => {
    const { status: perm } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm !== 'granted') {
      Alert.alert('Permission required', 'Allow photo access to upload documents.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const uri = result.assets[0].uri;
    setDocs(d => ({ ...d, [docType]: uri }));
    setUploading(docType);

    try {
      const formData = new FormData();
      formData.append('document', {
        uri,
        name: `${docType}.jpg`,
        type: 'image/jpeg',
      } as any);
      formData.append('type', docType);
      await kycAPI.uploadDocument(formData);
      Alert.alert('Uploaded', 'Document uploaded successfully. Verification usually takes 24–48 hrs.');
      setStatus('pending');
    } catch (err: any) {
      Alert.alert('Upload failed', err?.response?.data?.error || 'Please try again.');
    } finally {
      setUploading(null);
    }
  };

  if (loadingStatus) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.title}>Identity Verification</Text>
        <Text style={styles.subtitle}>
          Australian law requires identity verification before renting a vehicle.
        </Text>

        {/* Status Banner */}
        <StatusBanner status={status} />

        {/* Upload Cards */}
        {(status === 'not_submitted' || status === 'rejected') && (
          <View style={styles.uploadSection}>
            <Text style={styles.sectionTitle}>Required Documents</Text>

            <DocCard
              label="Driver's Licence — Front"
              docType="license_front"
              uri={docs.license_front}
              uploading={uploading === 'license_front'}
              onUpload={() => pickAndUpload('license_front')}
            />
            <DocCard
              label="Driver's Licence — Back"
              docType="license_back"
              uri={docs.license_back}
              uploading={uploading === 'license_back'}
              onUpload={() => pickAndUpload('license_back')}
            />
            <DocCard
              label="Selfie Photo (recommended)"
              docType="selfie"
              uri={docs.selfie}
              uploading={uploading === 'selfie'}
              onUpload={() => pickAndUpload('selfie')}
            />
          </View>
        )}

        {status === 'approved' && (
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.continueBtnText}>Continue to App</Text>
            <ChevronRight size={18} color="#fff" />
          </TouchableOpacity>
        )}

        <Text style={styles.note}>
          Your documents are encrypted and only used for identity verification.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusBanner({ status }: { status: KycStatus }) {
  const config = {
    not_submitted: {
      icon: <Upload size={22} color={Colors.primary} />,
      title: 'Documents Required',
      desc: 'Please upload your driving licence to continue.',
      bg: Colors.primary + '12',
      border: Colors.primary,
    },
    pending: {
      icon: <Clock size={22} color={Colors.warning} />,
      title: 'Verification Pending',
      desc: 'We are reviewing your documents. Usually takes 24–48 hours.',
      bg: Colors.warning + '15',
      border: Colors.warning,
    },
    approved: {
      icon: <ShieldCheck size={22} color={Colors.success} />,
      title: 'Identity Verified ✓',
      desc: 'You are verified and can book any vehicle.',
      bg: Colors.success + '15',
      border: Colors.success,
    },
    rejected: {
      icon: <XCircle size={22} color={Colors.danger} />,
      title: 'Verification Rejected',
      desc: 'Your documents were rejected. Please re-upload clear photos.',
      bg: Colors.danger + '12',
      border: Colors.danger,
    },
  };

  const c = config[status];
  return (
    <View style={[styles.statusBanner, { backgroundColor: c.bg, borderLeftColor: c.border }]}>
      {c.icon}
      <View style={{ flex: 1 }}>
        <Text style={styles.statusTitle}>{c.title}</Text>
        <Text style={styles.statusDesc}>{c.desc}</Text>
      </View>
    </View>
  );
}

function DocCard({
  label,
  docType,
  uri,
  uploading,
  onUpload,
}: {
  label: string;
  docType: string;
  uri: string | null;
  uploading: boolean;
  onUpload: () => void;
}) {
  return (
    <View style={styles.docCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.docLabel}>{label}</Text>
        {uri ? (
          <Image source={{ uri }} style={styles.docPreview} contentFit="cover" />
        ) : (
          <Text style={styles.docHint}>Tap to upload</Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
        onPress={onUpload}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Upload size={16} color="#fff" />
            <Text style={styles.uploadBtnText}>{uri ? 'Replace' : 'Upload'}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 24, gap: 20 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  statusBanner: {
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  statusTitle: { fontWeight: '700', color: Colors.text, fontSize: 15, marginBottom: 2 },
  statusDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  uploadSection: { gap: 14 },
  sectionTitle: { fontWeight: '700', color: Colors.text, fontSize: 16 },
  docCard: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  docLabel: { fontWeight: '600', color: Colors.text, fontSize: 14, marginBottom: 6 },
  docHint: { fontSize: 12, color: Colors.textSecondary },
  docPreview: { width: '100%', height: 80, borderRadius: 8, marginTop: 4 },
  uploadBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  uploadBtnDisabled: { backgroundColor: Colors.border },
  uploadBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  continueBtn: {
    backgroundColor: Colors.success,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  note: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
});
