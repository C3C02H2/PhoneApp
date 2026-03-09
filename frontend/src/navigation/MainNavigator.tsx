import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { HomeScreen } from '../screens/HomeScreen';
import { FeedScreen } from '../screens/FeedScreen';
import { PostDetailScreen } from '../screens/PostDetailScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { CreatePostScreen } from '../screens/CreatePostScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { WeeklySummaryScreen } from '../screens/WeeklySummaryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { BlockedUsersScreen } from '../screens/BlockedUsersScreen';
import { ChatListScreen } from '../screens/ChatListScreen';
import { ChatRoomScreen } from '../screens/ChatRoomScreen';
import { MainTabParamList, FeedStackParamList, ProfileStackParamList, ChatStackParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const FeedStack = createNativeStackNavigator<FeedStackParamList>();
const ProfStack = createNativeStackNavigator<ProfileStackParamList>();
const ChatStack = createNativeStackNavigator<ChatStackParamList>();

const stackScreenOpts = (title: string) => ({
  headerShown: true,
  headerTitle: title,
  headerStyle: { backgroundColor: colors.background.primary },
  headerTintColor: colors.primary.muted,
  animation: 'slide_from_right' as const,
});

const FeedStackNavigator: React.FC = () => (
  <FeedStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background.primary } }}>
    <FeedStack.Screen name="FeedList" component={FeedScreen} />
    <FeedStack.Screen name="PostDetail" component={PostDetailScreen} options={stackScreenOpts('')} />
    <FeedStack.Screen name="UserProfile" component={UserProfileScreen} options={stackScreenOpts('Profile')} />
  </FeedStack.Navigator>
);

const ProfileStackNavigator: React.FC = () => (
  <ProfStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background.primary } }}>
    <ProfStack.Screen name="Profile" component={ProfileScreen} />
    <ProfStack.Screen name="Calendar" component={CalendarScreen} options={stackScreenOpts('Calendar')} />
    <ProfStack.Screen name="Dashboard" component={DashboardScreen} options={stackScreenOpts('Dashboard')} />
    <ProfStack.Screen name="WeeklySummary" component={WeeklySummaryScreen} options={stackScreenOpts('Weekly Summary')} />
    <ProfStack.Screen name="Settings" component={SettingsScreen} options={stackScreenOpts('Settings')} />
    <ProfStack.Screen name="BlockedUsers" component={BlockedUsersScreen} options={stackScreenOpts('Blocked Users')} />
    <ProfStack.Screen name="Goals" component={GoalsScreen} options={stackScreenOpts('Focus Areas')} />
    <ProfStack.Screen name="UserProfile" component={UserProfileScreen} options={stackScreenOpts('Profile')} />
  </ProfStack.Navigator>
);

const ChatStackNavigator: React.FC = () => (
  <ChatStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background.primary } }}>
    <ChatStack.Screen name="ChatList" component={ChatListScreen} />
    <ChatStack.Screen name="ChatRoom" component={ChatRoomScreen} options={stackScreenOpts('Chat')} />
    <ChatStack.Screen name="UserProfile" component={UserProfileScreen} options={stackScreenOpts('Profile')} />
  </ChatStack.Navigator>
);

const TAB_ICONS: Record<string, { default: string; active: string }> = {
  Home:       { default: '\u2302', active: '\u2302' },
  Feed:       { default: '\u2630', active: '\u2630' },
  Create:     { default: '+',      active: '+' },
  Chat:       { default: '\u2709', active: '\u2709' },
  ProfileTab: { default: '\u2605', active: '\u2605' },
};

const TAB_LABELS: Record<string, string> = {
  Home: 'Home',
  Feed: 'Community',
  Create: '',
  Chat: 'Chat',
  ProfileTab: 'Profile',
};

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.tabBarInner}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const isCreate = route.name === 'Create';
          const icon = TAB_ICONS[route.name] || { default: '?', active: '?' };
          const label = TAB_LABELS[route.name] || route.name;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isCreate) {
            return (
              <TouchableOpacity key={route.key} onPress={onPress} activeOpacity={0.8} style={styles.createBtnWrap}>
                <View style={styles.createBtn}>
                  <Text style={styles.createBtnText}>+</Text>
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity key={route.key} onPress={onPress} activeOpacity={0.7} style={styles.tabItem}>
              <View style={[styles.tabIconWrap, isFocused && styles.tabIconWrapActive]}>
                <Text style={[styles.tabIconText, isFocused && styles.tabIconTextActive]}>
                  {isFocused ? icon.active : icon.default}
                </Text>
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export const MainNavigator: React.FC = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Feed" component={FeedStackNavigator} />
    <Tab.Screen name="Create" component={CreatePostScreen} />
    <Tab.Screen name="Chat" component={ChatStackNavigator} />
    <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ tabBarLabel: 'Profile' }} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: colors.background.primary,
    borderTopWidth: 0,
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: colors.background.secondary,
    marginHorizontal: 16,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabIconWrap: {
    width: 40,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: colors.accent.glow,
  },
  tabIconText: {
    fontSize: 20,
    color: colors.primary.disabled,
  },
  tabIconTextActive: {
    color: colors.accent.main,
  },
  tabLabel: {
    fontSize: 10,
    color: colors.primary.disabled,
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.accent.main,
    fontWeight: '600',
  },
  createBtnWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
  },
  createBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent.main,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  createBtnText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
    marginTop: -2,
  },
});
