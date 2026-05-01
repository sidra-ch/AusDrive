import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  List,
  Send,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { supportAPI } from '@/services/api';
import type { SupportTicket } from '@src/types';

const FAQS = [
  {
    q: 'How do I cancel a booking?',
    a: 'Go to Bookings tab, tap your booking, and select "Cancel Booking". Cancellation fees may apply within 24 hours of pickup.',
  },
  {
    q: 'What documents do I need to rent a car?',
    a: 'You need a valid Australian driver\'s licence (or international licence). Upload it in the KYC section before booking.',
  },
  {
    q: 'Is GST included in the price?',
    a: 'Yes, all prices are inclusive of 10% GST as required by Australian law. Your invoice shows the GST breakdown.',
  },
  {
    q: 'How does GPS tracking work?',
    a: 'All our vehicles have built-in GPS trackers. You can view your active booking\'s live location in the Tracking tab.',
  },
  {
    q: 'What happens if I return the car late?',
    a: 'Late returns are charged at the daily rate pro-rated per hour. Contact support if you need to extend your booking.',
  },
  {
    q: 'Can I extend my rental?',
    a: 'Yes, go to your active booking and tap "Extend Booking". You\'ll be charged for the additional days.',
  },
];

type Tab = 'faq' | 'contact' | 'tickets';

export default function SupportScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('faq');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Ticket form
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (activeTab === 'tickets') fetchTickets();
  }, [activeTab]);

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await supportAPI.getTickets();
      setTickets(res.data.tickets ?? []);
    } catch {
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  const submitTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Incomplete', 'Please fill in both subject and description.');
      return;
    }
    setSubmitting(true);
    try {
      await supportAPI.createTicket({ subject, description });
      Alert.alert('Submitted!', 'Your support request has been received. We\'ll get back to you within 24 hours.');
      setSubject('');
      setDescription('');
      setShowForm(false);
      setActiveTab('tickets');
      fetchTickets();
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.error || 'Could not submit ticket. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Support</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['faq', 'contact', 'tickets'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === 'faq' ? 'FAQ' : t === 'contact' ? 'Contact' : 'Tickets'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── FAQ Tab ── */}
        {activeTab === 'faq' && (
          <View style={styles.faqList}>
            {FAQS.map((f, i) => (
              <TouchableOpacity
                key={i}
                style={styles.faqCard}
                onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
                activeOpacity={0.7}
              >
                <View style={styles.faqHeader}>
                  <HelpCircle size={16} color={Colors.primary} />
                  <Text style={styles.faqQ}>{f.q}</Text>
                  {expandedFaq === i ? (
                    <ChevronUp size={16} color={Colors.textSecondary} />
                  ) : (
                    <ChevronDown size={16} color={Colors.textSecondary} />
                  )}
                </View>
                {expandedFaq === i && (
                  <Text style={styles.faqA}>{f.a}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Contact Tab ── */}
        {activeTab === 'contact' && (
          <View style={styles.contactList}>
            <ContactCard
              icon={<MessageCircle size={22} color="#25D366" />}
              title="WhatsApp Support"
              subtitle="Chat with us on WhatsApp"
              onPress={() => Linking.openURL('https://wa.me/61400000000')}
              bg="#25D36615"
            />
            <ContactCard
              icon={<Phone size={22} color={Colors.primary} />}
              title="Call Support"
              subtitle="+61 2 0000 0000  (Mon–Fri 8am–6pm AEST)"
              onPress={() => Linking.openURL('tel:+61200000000')}
              bg={Colors.primary + '15'}
            />
            <ContactCard
              icon={<Mail size={22} color={Colors.secondary} />}
              title="Email Support"
              subtitle="support@ausdrive.com.au"
              onPress={() => Linking.openURL('mailto:support@ausdrive.com.au')}
              bg={Colors.secondary + '15'}
            />
            <TouchableOpacity
              style={styles.newTicketBtn}
              onPress={() => { setActiveTab('tickets'); setShowForm(true); }}
            >
              <Plus size={18} color="#fff" />
              <Text style={styles.newTicketBtnText}>Create Support Ticket</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Tickets Tab ── */}
        {activeTab === 'tickets' && (
          <View style={styles.ticketsSection}>
            <TouchableOpacity
              style={styles.newTicketBtn}
              onPress={() => setShowForm(s => !s)}
            >
              <Plus size={18} color="#fff" />
              <Text style={styles.newTicketBtnText}>New Ticket</Text>
            </TouchableOpacity>

            {showForm && (
              <View style={styles.form}>
                <Text style={styles.formTitle}>Create Support Ticket</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Subject"
                  placeholderTextColor={Colors.textSecondary}
                  value={subject}
                  onChangeText={setSubject}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe your issue..."
                  placeholderTextColor={Colors.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={submitTicket}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Send size={16} color="#fff" />
                      <Text style={styles.submitBtnText}>Submit Ticket</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {loadingTickets ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
            ) : tickets.length === 0 ? (
              <View style={styles.empty}>
                <List size={40} color={Colors.border} />
                <Text style={styles.emptyText}>No tickets yet</Text>
              </View>
            ) : (
              tickets.map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactCard({
  icon,
  title,
  subtitle,
  onPress,
  bg,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  bg: string;
}) {
  return (
    <TouchableOpacity style={[styles.contactCard, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.contactIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.contactTitle}>{title}</Text>
        <Text style={styles.contactSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={18} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
}

function TicketCard({ ticket }: { ticket: SupportTicket }) {
  const statusColor = {
    open: Colors.primary,
    in_progress: Colors.warning,
    resolved: Colors.success,
    closed: Colors.textSecondary,
  }[ticket.status] ?? Colors.textSecondary;

  return (
    <View style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketSubject} numberOfLines={1}>{ticket.subject}</Text>
        <View style={[styles.ticketBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.ticketBadgeText, { color: statusColor }]}>
            {ticket.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.ticketDesc} numberOfLines={2}>{ticket.description}</Text>
      <Text style={styles.ticketDate}>{new Date(ticket.createdAt).toLocaleDateString('en-AU')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  pageHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: Colors.text },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontWeight: '600', fontSize: 13, color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },
  scroll: { padding: 20, gap: 14, paddingBottom: 40 },
  // FAQ
  faqList: { gap: 10 },
  faqCard: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
  },
  faqHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faqQ: { flex: 1, fontWeight: '600', fontSize: 14, color: Colors.text },
  faqA: { fontSize: 13, color: Colors.textSecondary, marginTop: 10, lineHeight: 20, paddingLeft: 26 },
  // Contact
  contactList: { gap: 12 },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  contactIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  contactTitle: { fontWeight: '700', fontSize: 15, color: Colors.text },
  contactSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  newTicketBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  newTicketBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  // Tickets
  ticketsSection: { gap: 14 },
  form: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  formTitle: { fontWeight: '700', fontSize: 16, color: Colors.text },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
  ticketCard: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ticketSubject: { flex: 1, fontWeight: '700', fontSize: 14, color: Colors.text },
  ticketBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  ticketBadgeText: { fontWeight: '700', fontSize: 10 },
  ticketDesc: { fontSize: 13, color: Colors.textSecondary },
  ticketDate: { fontSize: 11, color: Colors.textSecondary },
});
