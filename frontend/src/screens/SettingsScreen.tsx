import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, typography, spacing, screenPadding, borderRadius } from '../theme';
import { useAuth } from '../hooks/useAuth';
import { usersAPI, UserSettings } from '../api/users';

interface RowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  destructive?: boolean;
}

const Row: React.FC<RowProps> = ({ icon, label, value, onPress, isToggle, toggleValue, onToggle, destructive }) => (
  <TouchableOpacity style={styles.row} onPress={onPress} disabled={isToggle && !onPress} activeOpacity={0.6}>
    <View style={[styles.rowIcon, destructive && { backgroundColor: 'rgba(248,113,113,0.1)' }]}>
      <Text style={[styles.rowIconText, destructive && { color: colors.error.main }]}>{icon}</Text>
    </View>
    <Text style={[styles.rowLabel, destructive && { color: colors.error.main }]}>{label}</Text>
    {isToggle ? (
      <Switch
        value={toggleValue}
        onValueChange={onToggle}
        trackColor={{ false: colors.background.elevated, true: colors.accent.main }}
        thumbColor="#fff"
      />
    ) : (
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
        {onPress ? <Text style={styles.rowArrow}>{'\u203A'}</Text> : null}
      </View>
    )}
  </TouchableOpacity>
);

interface EditModalProps {
  visible: boolean;
  title: string;
  placeholder: string;
  initialValue?: string;
  onCancel: () => void;
  onSave: (value: string) => Promise<void>;
  secureTextEntry?: boolean;
}

const EditModal: React.FC<EditModalProps> = ({ visible, title, placeholder, initialValue, onCancel, onSave, secureTextEntry }) => {
  const [value, setValue] = useState(initialValue || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (visible) setValue(initialValue || ''); }, [visible]);

  const handleSave = async () => {
    if (!value.trim()) return;
    setSaving(true);
    try { await onSave(value.trim()); }
    catch (e: any) { Alert.alert('Error', e?.response?.data?.detail || 'Something went wrong'); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TextInput
            style={styles.modalInput}
            placeholder={placeholder}
            placeholderTextColor={colors.primary.disabled}
            value={value}
            onChangeText={setValue}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={secureTextEntry}
            autoFocus
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave} activeOpacity={0.7} disabled={saving || !value.trim()}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSaveText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const PasswordModal: React.FC<{ visible: boolean; onCancel: () => void; onSave: (cur: string, next: string) => Promise<void> }> = ({ visible, onCancel, onSave }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (visible) { setCurrent(''); setNext(''); setConfirm(''); } }, [visible]);

  const handleSave = async () => {
    if (next.length < 6) { Alert.alert('Error', 'New password must be at least 6 characters'); return; }
    if (next !== confirm) { Alert.alert('Error', 'Passwords do not match'); return; }
    setSaving(true);
    try { await onSave(current, next); }
    catch (e: any) { Alert.alert('Error', e?.response?.data?.detail || 'Something went wrong'); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Change Password</Text>
          <TextInput style={styles.modalInput} placeholder="Current password" placeholderTextColor={colors.primary.disabled} value={current} onChangeText={setCurrent} secureTextEntry autoFocus />
          <TextInput style={[styles.modalInput, { marginTop: spacing.sm }]} placeholder="New password" placeholderTextColor={colors.primary.disabled} value={next} onChangeText={setNext} secureTextEntry />
          <TextInput style={[styles.modalInput, { marginTop: spacing.sm }]} placeholder="Confirm new password" placeholderTextColor={colors.primary.disabled} value={confirm} onChangeText={setConfirm} secureTextEntry />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave} activeOpacity={0.7} disabled={saving || !current || !next}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSaveText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const REMINDER_TIMES = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00',
  '10:30', '11:00', '11:30', '12:00', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00',
];

const TimePickerModal: React.FC<{
  visible: boolean;
  title: string;
  currentTime: string;
  onCancel: () => void;
  onSelect: (time: string) => void;
}> = ({ visible, title, currentTime, onCancel, onSelect }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalCard}>
        <Text style={styles.modalTitle}>{title}</Text>
        <ScrollView style={{ maxHeight: 300 }}>
          {REMINDER_TIMES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.timeOption, currentTime === t && styles.timeOptionActive]}
              onPress={() => onSelect(t)}
              activeOpacity={0.7}
            >
              <Text style={[styles.timeOptionText, currentTime === t && styles.timeOptionTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={[styles.modalCancelBtn, { marginTop: spacing.md }]} onPress={onCancel} activeOpacity={0.7}>
          <Text style={styles.modalCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export const SettingsScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { user, logout, refreshUser } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    is_private: false,
    notifications_enabled: true,
    daily_reminder_enabled: true,
    daily_reminder_time: '08:00',
    evening_reminder_enabled: false,
    evening_reminder_time: '21:00',
    default_anonymous: false,
    weekly_summary_enabled: true,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [editUsernameVisible, setEditUsernameVisible] = useState(false);
  const [editEmailVisible, setEditEmailVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [dailyTimePickerVisible, setDailyTimePickerVisible] = useState(false);
  const [eveningTimePickerVisible, setEveningTimePickerVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await usersAPI.getSettings();
        setSettings(s);
      } catch (e) { console.error(e); }
      finally { setLoadingSettings(false); }
    })();
  }, []);

  const toggleSetting = async (key: keyof UserSettings) => {
    const current = settings[key];
    if (typeof current !== 'boolean') return;
    const newVal = !current;
    setSettings(prev => ({ ...prev, [key]: newVal }));
    try { await usersAPI.updateSettings({ [key]: newVal } as any); }
    catch (e) { setSettings(prev => ({ ...prev, [key]: !newVal })); Alert.alert('Error', 'Failed to update setting'); }
  };

  const updateTimeSetting = async (key: 'daily_reminder_time' | 'evening_reminder_time', value: string) => {
    const old = settings[key];
    setSettings(prev => ({ ...prev, [key]: value }));
    try { await usersAPI.updateSettings({ [key]: value } as any); }
    catch (e) { setSettings(prev => ({ ...prev, [key]: old })); Alert.alert('Error', 'Failed to update setting'); }
  };

  const handleUpdateUsername = async (username: string) => {
    await usersAPI.updateUsername(username);
    setEditUsernameVisible(false);
    if (refreshUser) refreshUser();
    Alert.alert('Done', 'Username updated');
  };

  const handleUpdateEmail = async (email: string) => {
    await usersAPI.updateEmail(email);
    setEditEmailVisible(false);
    if (refreshUser) refreshUser();
    Alert.alert('Done', 'Email updated');
  };

  const handleChangePassword = async (current: string, next: string) => {
    await usersAPI.changePassword(current, next);
    setPasswordVisible(false);
    Alert.alert('Done', 'Password changed successfully');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Are you sure?', 'Last chance. This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Yes, delete',
                style: 'destructive',
                onPress: async () => {
                  try { await usersAPI.deleteAccount(); logout(); }
                  catch (e) { Alert.alert('Error', 'Failed to delete account'); }
                },
              },
            ]);
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        {/* Notifications */}
        <Text style={styles.groupLabel}>NOTIFICATIONS</Text>
        <View style={styles.group}>
          <Row
            icon="\u23F0"
            label="Push Notifications"
            isToggle
            toggleValue={settings.notifications_enabled}
            onToggle={() => toggleSetting('notifications_enabled')}
          />
          <Row
            icon="\u263C"
            label="Daily Reminder"
            isToggle
            toggleValue={settings.daily_reminder_enabled}
            onToggle={() => toggleSetting('daily_reminder_enabled')}
          />
          {settings.daily_reminder_enabled && (
            <Row
              icon="\u231A"
              label="Reminder Time"
              value={settings.daily_reminder_time}
              onPress={() => setDailyTimePickerVisible(true)}
            />
          )}
          <Row
            icon="\u263D"
            label="Evening Reminder"
            isToggle
            toggleValue={settings.evening_reminder_enabled}
            onToggle={() => toggleSetting('evening_reminder_enabled')}
          />
          {settings.evening_reminder_enabled && (
            <Row
              icon="\u231A"
              label="Evening Time"
              value={settings.evening_reminder_time}
              onPress={() => setEveningTimePickerVisible(true)}
            />
          )}
          <Row
            icon="\u2691"
            label="Weekly Summary"
            isToggle
            toggleValue={settings.weekly_summary_enabled}
            onToggle={() => toggleSetting('weekly_summary_enabled')}
          />
        </View>

        {/* Preferences */}
        <Text style={styles.groupLabel}>PREFERENCES</Text>
        <View style={styles.group}>
          <Row
            icon="\u26BF"
            label="Private Profile"
            isToggle
            toggleValue={settings.is_private}
            onToggle={() => toggleSetting('is_private')}
          />
          <Row
            icon="\u25A6"
            label="Post Anonymously by Default"
            isToggle
            toggleValue={settings.default_anonymous}
            onToggle={() => toggleSetting('default_anonymous')}
          />
        </View>

        {/* Account */}
        <Text style={styles.groupLabel}>ACCOUNT</Text>
        <View style={styles.group}>
          <Row icon="\u270E" label="Username" value={user?.username || '\u2014'} onPress={() => setEditUsernameVisible(true)} />
          <Row icon="\u2709" label="Email" value={user?.email?.split('@')[0] || '\u2014'} onPress={() => setEditEmailVisible(true)} />
          <Row icon="\u26BF" label="Change Password" onPress={() => setPasswordVisible(true)} />
        </View>

        {/* Privacy */}
        <Text style={styles.groupLabel}>PRIVACY</Text>
        <View style={styles.group}>
          <Row icon="\u26D4" label="Blocked Users" onPress={() => navigation?.navigate('BlockedUsers')} />
        </View>

        {/* Info */}
        <Text style={styles.groupLabel}>INFO</Text>
        <View style={styles.group}>
          <Row icon="\u2139" label="Version" value="5.0.1" />
        </View>

        {/* Actions */}
        <View style={[styles.group, { marginTop: spacing.xxl }]}>
          <Row icon="\u2192" label="Log out" onPress={handleLogout} destructive />
        </View>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.7}>
          <Text style={styles.deleteBtnText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      <EditModal
        visible={editUsernameVisible}
        title="Change Username"
        placeholder="New username"
        initialValue={user?.username}
        onCancel={() => setEditUsernameVisible(false)}
        onSave={handleUpdateUsername}
      />

      <EditModal
        visible={editEmailVisible}
        title="Change Email"
        placeholder="New email address"
        initialValue={user?.email}
        onCancel={() => setEditEmailVisible(false)}
        onSave={handleUpdateEmail}
      />

      <PasswordModal
        visible={passwordVisible}
        onCancel={() => setPasswordVisible(false)}
        onSave={handleChangePassword}
      />

      <TimePickerModal
        visible={dailyTimePickerVisible}
        title="Daily Reminder Time"
        currentTime={settings.daily_reminder_time}
        onCancel={() => setDailyTimePickerVisible(false)}
        onSelect={(t) => { updateTimeSetting('daily_reminder_time', t); setDailyTimePickerVisible(false); }}
      />

      <TimePickerModal
        visible={eveningTimePickerVisible}
        title="Evening Reminder Time"
        currentTime={settings.evening_reminder_time}
        onCancel={() => setEveningTimePickerVisible(false)}
        onSelect={(t) => { updateTimeSetting('evening_reminder_time', t); setEveningTimePickerVisible(false); }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  scroll: { paddingHorizontal: screenPadding.horizontal, paddingTop: spacing.xxl, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: '700', color: colors.primary.main, marginBottom: spacing.lg },

  groupLabel: {
    fontSize: 11, fontWeight: '600', color: colors.primary.disabled, letterSpacing: 1.5,
    marginTop: spacing.xxl, marginBottom: spacing.sm, marginLeft: spacing.xs,
  },
  group: {
    backgroundColor: colors.background.secondary, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border.subtle, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    paddingHorizontal: spacing.lg, borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  rowIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: colors.background.elevated, alignItems: 'center',
    justifyContent: 'center', marginRight: spacing.lg,
  },
  rowIconText: { fontSize: 15, color: colors.accent.main },
  rowLabel: { fontSize: 15, fontWeight: '500', color: colors.primary.main, flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, maxWidth: 140 },
  rowValue: { fontSize: 13, color: colors.primary.disabled },
  rowArrow: { fontSize: 22, color: colors.primary.disabled },

  deleteBtn: { alignSelf: 'center', marginTop: spacing.xxl, paddingVertical: spacing.md, paddingHorizontal: spacing.xxl },
  deleteBtnText: { fontSize: 14, color: colors.error.main, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { backgroundColor: colors.background.secondary, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border.subtle },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.primary.main, marginBottom: spacing.lg },
  modalInput: {
    backgroundColor: colors.background.elevated, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15,
    color: colors.primary.main, borderWidth: 1, borderColor: colors.border.subtle,
  },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.background.elevated, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: colors.primary.muted },
  modalSaveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.accent.main, alignItems: 'center' },
  modalSaveText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  timeOption: {
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10,
    marginBottom: 4, backgroundColor: colors.background.elevated,
  },
  timeOptionActive: { backgroundColor: colors.accent.main },
  timeOptionText: { fontSize: 15, color: colors.primary.muted, textAlign: 'center', fontWeight: '500' },
  timeOptionTextActive: { color: '#fff', fontWeight: '700' },
});
