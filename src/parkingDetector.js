import {PermissionsAndroid} from "react-native";
import Geolocation from "@react-native-community/geolocation";
import {gyroscope, SensorTypes, setUpdateIntervalForType} from "react-native-sensors";
import getDistance from "geolib/es/getDistance";
import Contacts from "react-native-contacts";
import RNImmediatePhoneCall from "react-native-immediate-phone-call";
import {steps} from "./steps.js"

const refreshInterval = 80;
setUpdateIntervalForType(SensorTypes.gyroscope, refreshInterval);

var startTime = null;
var watchID = null;
var grad = 57.2957795131;
var interval = null;
var gyroSubscription = null;
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

export const startDetector = () => (dispatch, state) => {

  return PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: "Location Accessing Permission",
      message: "App needs access to your location"
    }
  ).then((granted) => {

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      //don`t know why we need this but we need...
      Geolocation.getCurrentPosition(
        (position) => {
          dispatch(updatePosition(position));
        },
        (error) => {
        } /*alert("initial: " + error.message)*/,
        geolocationDefaultOptions
      );
      watchID = Geolocation.watchPosition((position) => {
          dispatch(updatePosition(position));
          dispatch(checkPosition(position)); // TODO: refactor
        },
        (error) => {
        }/*alert("current: " + error.message)*/,
        geolocationDefaultOptions
      );
    }
  });
};


export const checkPosition = (position) => (dispatch, state) => {
  var step = steps.filter(step => !step.executed);
  var distance = 0;
  var stepLabel = null;
  if (step[0]) {
    if (step[0].coordinate) {
      distance = getDistance(
        {latitude: position.coords.latitude, longitude: position.coords.longitude},
        step[0].coordinate);
      if (distance < Math.max(Math.min(MAX_PRECISION, position.coords.accuracy), MIN_PRECISION)) { //toDOO check time
        step[0].executed = true;
        stepLabel = step[0].label;
      }
    } else if (step[0].angleY && interval == null && gyroSubscription == null) {

      gyroSubscription = gyroscope.subscribe(({x, y, z, timestamp}) => {
        //TODO: we should use y axel
        var angleY = state().parkingReducer.data.angleY;
        if (angleY > step[0].angleY * 0.85) {
          step[0].executed = true;
          stepLabel = step[0].label;

          interval = setInterval(() => {

            PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.CALL_PHONE,
              {
                title: "Auto call permission",
                message: "App needs access to call"
              }
            ).then((granted) => {
              if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                PermissionsAndroid.request(
                  PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                  {
                    'title': 'Contacts',
                    'message': 'This app would like to view your contacts.'
                  }
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
};