import React, { Component } from 'react'
import { View, Text, Switch, StyleSheet, PermissionsAndroid,AsyncStorage ,Linking,Button ,} from 'react-native'
import Geolocation from '@react-native-community/geolocation';
import getDistance from 'geolib/es/getDistance';
import RNImmediatePhoneCall from 'react-native-immediate-phone-call';
import Contacts from 'react-native-contacts';
import { gyroscope, setUpdateIntervalForType ,SensorTypes  } from "react-native-sensors";
import { map, filter } from "rxjs/operators";
const refreshInterval = 80;
setUpdateIntervalForType(SensorTypes.gyroscope, refreshInterval);
 var watchID = null;
export const startDetector = (component) => {
 PermissionsAndroid.request(
         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
         {
           title: "Location Accessing Permission",
           message: "App needs access to your location"
         }
       ).then((granted)=>{
         if (granted === PermissionsAndroid.RESULTS.GRANTED) {

             watchID = Geolocation.watchPosition((position) => {
                const lastPosition = JSON.stringify(position);
                if(position && position.coords ){
                    var distance =  getDistance(
                                        { latitude: position.coords.latitude, longitude: position.coords.longitude },
//                                         { latitude: 53.8841564, longitude: 27.4491562 },
                                          { latitude: 53.91783263, longitude: 27.59183951 },
                                    );
                    if(distance<120){
//                        this.call() // TODO: remember about accuracy
                    }
                    component.setState({ lastPosition ,distance,latitude: position.coords.latitude,longitude: position.coords.longitude});
                }
             },
                       (error) => alert("current: " + error.message),
                       { enableHighAccuracy: true, timeout: 30000, maximumAge: 1000 , distanceFilter: 5}
             );
             }
       });
   var grad = 57.3;
        gyroscope.subscribe(({ x, y, z, timestamp  }) => {
                //TODO: we should use y axel
                var angleY = component.state.angleY;

                 component.setState({
                   gyroscope: `x: ${(x * grad).toFixed(3)}
                               y: ${(y * grad).toFixed(3)}
                               z: ${(z * grad).toFixed(3)}`,
                   angleY: (angleY + (y * grad) * (1.0/(1000 / refreshInterval)))
                 });
               });

}

export const stopDetector = () => {
      Geolocation.clearWatch(watchID);

}