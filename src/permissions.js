import {PermissionsAndroid} from "react-native";
import {ACCESS_FINE_LOCATION_MESSAGE, CALL_PERMISSIONS_MESSAGE, CONTACT_PERMISSIONS_MESSAGE} from "./messages";

const messages = {}
messages[android.permission.ACCESS_FINE_LOCATION] = ACCESS_FINE_LOCATION_MESSAGE;
messages[android.permission.READ_CONTACTS] = CONTACT_PERMISSIONS_MESSAGE;
messages[android.permission.CALL_PHONE] = CALL_PERMISSIONS_MESSAGE;

export const executeWithPermissions = async (permissions, fn) => {
  let grantedAll = true;
  let permissionsToCheck = permissions;
  if (!Array.isArray(permissions)) {
    permissionsToCheck = [permissions];
  }
  await asyncForEach(permissionsToCheck, async (permission) => {
    grantedAll &= await PermissionsAndroid.request(permission, messages[permission]);
  });

  if (grantedAll) {
    fn();
  }
}

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
