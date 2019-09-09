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
 {executed:false, minSecToNext: 2,maxSecToNext: 120,   coordinate:{ latitude: 53.88536555573422, longitude: 27.505116325477758 }, label: "One"},
 {executed:false,  minSecToNext: 2, maxSecToNext: 120, coordinate:{ latitude: 53.88516589532855, longitude: 27.505888801674043 }, label: "Two"},
 {executed:false, angleY: 90.0, label: "Three"}]

 var startTime = null;
 var watchID = null;
 var grad = 57.2957795131;
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
                                               // max min was made to prevent step pass with low precision
                                            if(distance<Math.max(Math.min(40, position.coords.accuracy), 15)){ //tDOO check time
                                            step[0].executed = true;
                                            stepLabel = step[0].label;
                            //                        this.call() // TODO: remember about accuracy
                                            }
                         } else if(step[0].angleY){

                                gyroscope.subscribe(({ x, y, z, timestamp  }) => {
                             //TODO: we should use y axel
                                    var angleY = component.state.angleY;
                                    if(angleY>step[0].angleY*0.85){
                                        step[0].executed = true;
                                        stepLabel=step[0].label;

                                        setInterval(()=>{

                                            PermissionsAndroid.request(
                                                    PermissionsAndroid.PERMISSIONS.CALL_PHONE,
                                                    {
                                                      title: "Auto call permission",
                                                      message: "App needs access to call"
                                                    }
                                                  ).then((granted)=>{
                                                    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                                                   PermissionsAndroid.request(
                                                     PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                                                     {
                                                       'title': 'Contacts',
                                                       'message': 'This app would like to view your contacts.'
                                                     }
                                                   ).then(() => {
                                                     Contacts.getAll((err, contacts) => {
                                                       if (err === 'denied'){
                                                         // error
                                                       } else {
//                                                       var parking = contacts.filter(contact=>contact.displayName==='Парковка');
                                                       var parking = contacts.filter(contact=>contact.displayName==='Жена');
                                                       var parkingNumber = parking[0].phoneNumbers[0].number;
                                                          component.setState({parking:parkingNumber});
                                                        RNImmediatePhoneCall.immediatePhoneCall(parkingNumber);

                                                       }
                                                     })
                                                   })
                                                        }});

                                        },3000);


                                    }
                                    component.setState({
                                        gyroscope: `y: ${(y * grad).toFixed(3)}`,
                                        angleY: (angleY + (y * grad) * (1.0/(1000 / refreshInterval)))
                                    });
                            });
                         }
                    }

                    var newState={ lastPosition ,distance,latitude: position.coords.latitude,longitude: position.coords.longitude, accuracy:`real: ${position.coords.accuracy}; my: ${Math.max(Math.min(40, position.coords.accuracy), 15)}`};
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

       });


}

export const stopDetector = () => {
      Geolocation.clearWatch(watchID);

}