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
export class SwitchExample extends Component {
   state = {
      lastPosition: 'unknown',
      distance: 'unknown',
      latitude: 'unknown',
      longitude: 'unknown',
      parking: 'unknown',
      gyroscope: 'unknown',
      angleY: 0.0,
   }
   watchID = null;
   componentDidMount = () => {
  PermissionsAndroid.request(
         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
         {
           title: "Location Accessing Permission",
           message: "App needs access to your location"
         }
       ).then((granted)=>{
         if (granted === PermissionsAndroid.RESULTS.GRANTED) {

             this.watchID = Geolocation.watchPosition((position) => {
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
                    this.setState({ lastPosition ,distance,latitude: position.coords.latitude,longitude: position.coords.longitude});
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
                var angleY = this.state.angleY;

                 this.setState({
                   gyroscope: `x: ${(x * grad).toFixed(3)}
                               y: ${(y * grad).toFixed(3)}
                               z: ${(z * grad).toFixed(3)}`,
                   angleY: (angleY + (y * grad) * (1.0/(1000 / refreshInterval)))
                 });
               });


   }
   componentWillUnmount = () => {
      Geolocation.clearWatch(this.watchID);
   }
   call=()=>{
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
//               var parking = contacts.filter(contact=>contact.displayName==='Парковка');
               var parking = contacts.filter(contact=>contact.displayName==='Жена');
               var parkingNumber = parking[0].phoneNumbers[0].number;
                  this.setState({parking:parkingNumber});
                RNImmediatePhoneCall.immediatePhoneCall(parkingNumber);

               }
             })
           })

//                RNImmediatePhoneCall.immediatePhoneCall('+123456789');
                }});
   }
   render() {
      return (
         <View style = {styles.container}>
                       <Text style = {styles.boldText}>
               Current position:
            </Text>

            <Text>
               {this.state.lastPosition}
            </Text>
            <Text style = {styles.boldText}>
               Distance:
            </Text>
            <Text>
               {this.state.distance}
            </Text>
             <Text style = {styles.boldText}>
               latitude:
            </Text>
            <Text>
               {this.state.latitude}
            </Text>
              <Text style = {styles.boldText}>
                 longitude:
              </Text>
              <Text>
                  {this.state.longitude}
               </Text>
               <Button
                title="Call"
                accessibilityLabel="Learn more about this purple button"
                onPress={this.call}/>
                 <Text style = {styles.boldText}>
                                 parking:
                              </Text>
                              <Text>
                                  {this.state.parking}
                               </Text>
                               <Text style = {styles.boldText}>
                                 gyroscope:
                              </Text>
                              <Text>
                                  {this.state.gyroscope}
                               </Text>
                                <Text style = {styles.boldText}>
                                 Angle Y:
                              </Text>
                              <Text>
                                  {parseFloat(this.state.angleY).toFixed(3)}
                               </Text>


         </View>
      )
   }
}

const styles = StyleSheet.create ({
   container: {
      flex: 1,
      alignItems: 'center',
      marginTop: 50,
      marginBottom: 50,
   },
   boldText: {
      fontSize: 30,
      color: 'red',
   }
})