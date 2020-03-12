import {PermissionsAndroid} from "react-native";
import Geolocation from "@react-native-community/geolocation";
import {accelerometer, gyroscope, SensorTypes, setUpdateIntervalForType} from "react-native-sensors";
import getDistance from "geolib/es/getDistance";
import Contacts from "react-native-contacts";
import RNImmediatePhoneCall from "react-native-immediate-phone-call";
import {steps} from "./steps.js"
import {ACCESS_FINE_LOCATION_MESSAGE, CALL_PERMISSIONS_MESSAGE, CONTACT_PERMISSIONS_MESSAGE} from "./messages";
import {MAX_PRECISION, MIN_PRECISION} from "./steps";

const refreshInterval = 80;
const refreshIntervalAccelerometer = 300;
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
const G = 9.8;

export const startDetector = () => wrap(async (dispatch, getState) => {

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ACCESS_FINE_LOCATION_MESSAGE
  );
  accelerometer.subscribe(({x, y, z, timestamp}) => {
    dispatch({
      type: "update", data: {
        accelerometerString: `x: ${x.toFixed(1)} y: ${y.toFixed(1)} z: ${z.toFixed(1)}`,
        accelerometer: {x, y, z}
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
  return await new Promise(resolve => setImmediate(resolve));
});

export const stopDetector = () => {
  Geolocation.clearWatch(watchID);
  magnetometerSubscription != null && magnetometerSubscription.unsubscribe();
  accelerometerSubscription != null && accelerometerSubscription.unsubscribe();
  gyroSubscription != null && gyroSubscription.unsubscribe();
};

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

const checkPosition = (position) => (dispatch, state) => {
  var step = steps.filter(step => !step.executed);
  var distance = 0;
  var stepLabel = null;
  if (step[0] && step[0].coordinate) {
    distance = getDistance(
      {latitude: position.coords.latitude, longitude: position.coords.longitude},
      step[0].coordinate);
    if (distance < Math.max(Math.min(MAX_PRECISION, position.coords.accuracy), MIN_PRECISION)) { //toDO check time
      stepLabel = passStep(step);
    }
  } else if (step[0] && step[0].angleY && interval == null && gyroSubscription == null) {

    gyroSubscription = gyroscope.subscribe(({x, y, z, timestamp}) => {
      //TODO: use z and y
      var accelerometer = getState().parkingReducer.data.accelerometer;
      var angleY = getState().parkingReducer.data.angleY;
      const deltaAngleY = radToGrad(z) * (accelerometer.z / G) + radToGrad(y) * (accelerometer.y / G);
      angleY += deltaAngleY;
      if (angleY > step[0].angleY * 0.85) {
        stepLabel = passStep(step);
        callToParking();
      }
      dispatch({
        type: "update", data: {
          gyroscope: `y: ${(y * grad).toFixed(3)}`,
          angleY: angleY
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

const radToGrad = (z) => {
  return (z * grad) * (1.0 / (1000 / refreshInterval));
}

const callToParking = () => {
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

const passStep = (step) => {
  step[0].executed = true;
  return `${step[0].label} passed`;
}

const wrap = (fn) => (dispatch, getState) => {
  return fn(dispatch, getState).catch(error => dispatch({type: 'ERROR', error}));
}