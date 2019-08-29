import React, { Component } from 'react'
import { View, Text, Switch, StyleSheet, PermissionsAndroid,AsyncStorage ,} from 'react-native'
import Geolocation from '@react-native-community/geolocation';

export class SwitchExample extends Component {
   state = {
      initialPosition: 'unknown',
      lastPosition: 'unknown',
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
                (error) => alert(error.message),
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 , distanceFilter: 5}
             );
             this.watchID = Geolocation.watchPosition((position) => {
                const lastPosition = JSON.stringify(position);
                this.setState({ lastPosition });
             },
                       (error) => alert(error.message),
                       { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 , distanceFilter: 5}
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