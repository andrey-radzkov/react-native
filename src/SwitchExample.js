import React, { Component } from 'react'
import { View, Text, Switch, StyleSheet, PermissionsAndroid,AsyncStorage ,} from 'react-native'
import Geolocation from '@react-native-community/geolocation';
import getDistance from 'geolib/es/getDistance';

export class SwitchExample extends Component {
   state = {
      initialPosition: 'unknown',
      lastPosition: 'unknown',
      distance: 'unknown',
      latitude: 'unknown',
      longitude: 'unknown',
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
             Geolocation.getCurrentPosition(
                (position) => {
                   const initialPosition = JSON.stringify(position);
                   this.setState({ initialPosition });
                },
                (error) => alert("initial: " + error.message),
                { enableHighAccuracy: true, timeout: 30000, maximumAge: 1000 , distanceFilter: 5}
             );
             this.watchID = Geolocation.watchPosition((position) => {
                const lastPosition = JSON.stringify(position);
                if(position && position.coords ){
                    var distance =  getDistance(
                                        { latitude: position.coords.latitude, longitude: position.coords.longitude },
                                         //{ latitude: 53.8841564, longitude: 27.4491562 },
                                          { latitude: 53.91783263, longitude: 27.59183951 },
                                    );
                    if(distance<120){
    //                alert("we are at home");
                        alert("we are at work"); // TODO: remember about accuracy
                    }
                    this.setState({ lastPosition ,distance,latitude: position.coords.latitude,longitude: position.coords.longitude});
                }
             },
                       (error) => alert("current: " + error.message),
                       { enableHighAccuracy: true, timeout: 30000, maximumAge: 1000 , distanceFilter: 5}
             );
             }
       });

   }
   componentWillUnmount = () => {
      Geolocation.clearWatch(this.watchID);
   }
   render() {
      return (
         <View style = {styles.container}>
            <Text style = {styles.boldText}>
               Initial position:
            </Text>

            <Text>
               {this.state.initialPosition}
            </Text>

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
         </View>
      )
   }
}

const styles = StyleSheet.create ({
   container: {
      flex: 1,
      alignItems: 'center',
      marginTop: 50
   },
   boldText: {
      fontSize: 30,
      color: 'red',
   }
})