import React, {Component} from "react";
import {Button, PermissionsAndroid, StyleSheet, Text, View} from "react-native";
import RNImmediatePhoneCall from "react-native-immediate-phone-call";
import Contacts from "react-native-contacts";
import {gyroscope, SensorTypes, setUpdateIntervalForType} from "react-native-sensors";
import {startDetector, stopDetector} from "./parkingDetector";
import connect from "react-redux/lib/connect/connect";


const mapDispatchToProps = (dispatch) => {
    return {
    };
};
export const mapStateToProps = (state) => {
    return {
    };
};

//@connect(mapStateToProps, mapDispatchToProps)
export   const SensorValuesScreen = connect(mapStateToProps, mapDispatchToProps) (class SensorValuesScreenClass extends Component {
    state = {
        lastPosition: 'unknown',
        distance: 'unknown',
        latitude: 'unknown',
        longitude: 'unknown',
        accuracy: 'unknown',
        gyroscope: 'unknown',
        angleY: 0.0,
        stepLabel: "Not started",
    }
    constructor(props) {
        super(props);
    }
    componentDidMount = () => {
        startDetector(this);
    }
    componentWillUnmount = () => {
        stopDetector();
    }


    render() {
        return (
            <View style={styles.container}>

                <Text style={styles.boldText}>
                    Step:
                </Text>
                <Text>
                    {this.state.stepLabel}
                </Text>
                <Text style={styles.boldText}>
                    Distance:
                </Text>
                <Text>
                    {this.state.distance}
                </Text>
                <Text style={styles.boldText}>
                    latitude:
                </Text>
                <Text>
                    {this.state.latitude}
                </Text>
                <Text style={styles.boldText}>
                    longitude:
                </Text>
                <Text>
                    {this.state.longitude}
                </Text>
                <Text style={styles.boldText}>
                    accuracy:
                </Text>
                <Text>
                    {this.state.accuracy}
                </Text>
                <Text style={styles.boldText}>
                    gyroscope:
                </Text>
                <Text>
                    {this.state.gyroscope}
                </Text>
                <Text style={styles.boldText}>
                    Angle Y:
                </Text>
                <Text>
                    {parseFloat(this.state.angleY).toFixed(3)}
                </Text>


            </View>
        )
    }
})

const styles = StyleSheet.create({
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