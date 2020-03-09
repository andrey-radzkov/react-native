import {PermissionsAndroid} from "react-native";
import Geolocation from "@react-native-community/geolocation";
import {accelerometer, gyroscope, magnetometer, SensorTypes, setUpdateIntervalForType} from "react-native-sensors";
import getDistance from "geolib/es/getDistance";
import Contacts from "react-native-contacts";
import RNImmediatePhoneCall from "react-native-immediate-phone-call";
import {steps} from "./steps.js"
import {ACCESS_FINE_LOCATION_MESSAGE, CALL_PERMISSIONS_MESSAGE, CONTACT_PERMISSIONS_MESSAGE} from "./messages";

const refreshInterval = 80;
const refreshIntervalAccelerometer = 200;
setUpdateIntervalForType(SensorTypes.gyroscope, refreshInterval);
setUpdateIntervalForType(SensorTypes.accelerometer, refreshIntervalAccelerometer);
setUpdateIntervalForType(SensorTypes.magnetometer, refreshInterval);

var startTime = null;
var watchID = null;
var grad = (180 / Math.PI);
var interval = null;
var gyroSubscription = null;
var magnetometerSubscription = null;
var accelerometerSubscription = null;
var executedCall = false;
const geolocationDefaultOptions = {enableHighAccuracy: true, timeout: 30000, maximumAge: 1000, distanceFilter: 5};

const MAX_PRECISION = 40;
const MIN_PRECISION = 15;

const updatePosition = (position) => (dispatch) => {
  if (position && position.coords) {
    dispatch({
      type: "update", data: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: `real: ${position.coords.accuracy}; my: ${Math.max(Math.min(MAX_PRECISION, position.coords.accuracy),
          MIN_PRECISION)}`
      }
    });
  }
};
const degree = magnetometer => {
  return magnetometer - 90 >= 0
    ? magnetometer - 90
    : magnetometer + 271;
};

export const startDetector = () => wrap(async (dispatch, state) => {

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ACCESS_FINE_LOCATION_MESSAGE
  );
  accelerometer.subscribe(({x, y, z, timestamp}) => {
    dispatch({
      type: "update", data: {
        accelerometer: `x: ${x.toFixed(1)} y: ${y.toFixed(1)} z: ${z.toFixed(1)}}`,
      }
    });
  });
  magnetometer.subscribe(({x, y, z, timestamp}) => {
    let angle = 0;
    if (Math.atan2(-z, x) >= 0) {
      angle = Math.atan2(-z, x) * (180 / Math.PI)
    } else {
      angle = (Math.atan2(-z, x) + 2 * Math.PI) * (180 / Math.PI)
    }
    // if (Math.atan2(y, x) >= 0) {
    //   angle = Math.atan2(y, x) * (180 / Math.PI)
    // } else {
    //   angle = (Math.atan2(y, x) + 2 * Math.PI) * (180 / Math.PI)
    // }
    dispatch({
      type: "update", data: {
        magnetometer: `x: ${x.toFixed(1)} y: ${y.toFixed(1)} z: ${z.toFixed(1)}}`,
        angleY: degree(Math.round(angle)),
      }
    });
  });
  if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    //don`t know why we need this but we need...
    Geolocation.getCurrentPosition(
      (position) => {
        dispatch(updatePosition(position));
      },
      (error) => {
      },
      geolocationDefaultOptions
    );
    watchID = Geolocation.watchPosition((position) => {
        dispatch(updatePosition(position));
        dispatch(checkPosition(position)); // TODO: refactor
      },
      (error) => {
      },
      geolocationDefaultOptions
    );
  }
  // });
  await new Promise(resolve => setImmediate(resolve));
  throw new Error('Oops!');
});


export const checkPosition = (position) => (dispatch, state) => {
  var step = steps.filter(step => !step.executed);
  var distance = 0;
  var stepLabel = null;
  if (step[0] && step[0].coordinate) {
    distance = getDistance(
      {latitude: position.coords.latitude, longitude: position.coords.longitude},
      step[0].coordinate);
    if (distance < Math.max(Math.min(MAX_PRECISION, position.coords.accuracy), MIN_PRECISION)) { //toDOO check time
      step[0].executed = true;
      stepLabel = `${step[0].label} passed`;
    }
  } else if (step[0] && step[0].angleY && interval == null && gyroSubscription == null) {

    gyroSubscription = gyroscope.subscribe(({x, y, z, timestamp}) => {
      //TODO: we should use y axel
      var angleY = state().parkingReducer.data.angleY;
      if (angleY > step[0].angleY * 0.85) {
        step[0].executed = true;
        stepLabel = step[0].label;

        interval = setInterval(() => {

          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CALL_PHONE,
            CALL_PERMISSIONS_MESSAGE
          ).then((granted) => {
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
              PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                CONTACT_PERMISSIONS_MESSAGE
              ).then(() => {
                Contacts.getAll((err, contacts) => {
                  if (err === 'denied') {
                    // error
                  } else if (!executedCall) {
                    var parking = contacts.filter(contact => contact.displayName === 'Парковка');
//                       var parking = contacts.filter(contact => contact.displayName === 'Жена');
                    var parkingNumber = parking[0].phoneNumbers[0].number;
                    RNImmediatePhoneCall.immediatePhoneCall(parkingNumber);
                    if (gyroSubscription != null) {
                      gyroSubscription.unsubscribe();
                    }
                    executedCall = true;
                  }
                })
              })
            }
          });

        }, 1500);


      }
      dispatch({
        type: "update", data: {
          gyroscope: `y: ${(y * grad).toFixed(3)}`,
          angleY: (angleY + (y * grad) * (1.0 / (1000 / refreshInterval)))
        }
      });
    });
  }

  var newState = {
    distance,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: `real: ${position.coords.accuracy}; my: ${Math.max(Math.min(MAX_PRECISION, position.coords.accuracy),
      MIN_PRECISION)}`
  };
  if (stepLabel) {
    newState.stepLabel = stepLabel;
  }
  dispatch({type: "update", data: newState});
};

export const stopDetector = () => {
  Geolocation.clearWatch(watchID);
  magnetometerSubscription != null && magnetometerSubscription.unsubscribe();
  accelerometerSubscription != null && accelerometerSubscription.unsubscribe();
  gyroSubscription != null && gyroSubscription.unsubscribe();
};

function wrap(fn) {
  return function (dispatch) {
    fn(dispatch).catch(error => dispatch({type: 'ERROR', error}));
  };
}