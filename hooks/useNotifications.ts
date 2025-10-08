// On web, push notifications are not fully supported.
// We'll return an empty function that does nothing to avoid build errors.
async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  console.log('Push notifications are not fully supported on web. Skipping registration.');
  return undefined;
}

export { registerForPushNotificationsAsync };