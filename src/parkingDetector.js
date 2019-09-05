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

 var steps=[
 {executed:false, minSecToNext: 2,maxSecToNext: 120,   coordinate:{ latitude: 53.9174858, longitude: 27.5903552 }, label: "One"},
 {executed:false,  minSecToNext: 2, maxSecToNext: 120, coordinate:{ latitude: 53.9182948, longitude: 27.589353 }, label: "Two"},
 {executed:false, angleY: 90.0}]

 var startTime = null;
 var watchID = null;

export const startDetector = (component) => {
 return PermissionsAndroid.request(
         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
         {
           title: "Location Accessing Permission",
           message: "App needs access to your location"
         }
       ).then((granted)=>{
//        alert("results: " + granted);
         if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            //don`t know why we need this but we need...
            Geolocation.getCurrentPosition(
                (position) => {
                   component.setState({ latitude: position.coords.latitude,longitude: position.coords.longitude });
                },
                (error) => alert("initial: " + error.message),
                { enableHighAccuracy: true, timeout: 30000, maximumAge: 1000 , distanceFilter: 5}
             );
             watchID = Geolocation.watchPosition((position) => {
                const lastPosition = JSON.stringify(position);
//                alert("we are in " + lastPosition);
                if(position && position.coords ){
                    var step = steps.filter(step=>!step.executed );
                    var distance = 0;
                    var stepLabel = null
                    if(step[0]){
                        if(step[0].coordinate){
                            distance =  getDistance(
                                              { latitude: position.coords.latitude, longitude: position.coords.longitude },
                                               step[0].coordinate);
                                            if(distance<Math.min(30, position.coords.accuracy)){ //tDOO check time
                                            step[0].executed = true;
                                            stepLabel = step[0].label;
                            //                        this.call() // TODO: remember about accuracy
                                            }
                         } else {
                                //tODO: gyroscope
                         }
                    }

                    var newState={ lastPosition ,distance,latitude: position.coords.latitude,longitude: position.coords.longitude};
                    if(stepLabel){
                        newState.stepLabel = stepLabel;
                    }
                    component.setState(newState);
                }
             },
                       (error) => alert("current: " + error.message),
                       { enableHighAccuracy: true, timeout: 30000, maximumAge: 1000 , distanceFilter: 5}
             );
             }
             var grad = 57.2957795131;
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
       });


}

export const stopDetector = () => {
      Geolocation.clearWatch(watchID);

}