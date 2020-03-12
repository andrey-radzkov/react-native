import React, {useEffect} from "react";
import {StyleSheet, Text, View} from "react-native";
import {startDetector, stopDetector} from "./parkingDetector";
import {useDispatch, useSelector} from 'react-redux'

export const SensorValuesScreen = () => {
  const dispatch = useDispatch();

  const parking = useSelector(state => state.parkingReducer.data);

  useEffect(() => {
    dispatch(startDetector());
    return () => {
      stopDetector();
    };
  }, []);
  return (
    <View style={styles.container}>
      <Text style={styles.boldText}>
        Accelerometer:
      </Text>
      <Text>
        {parking.accelerometerString}
      </Text>
      {parking.magnetometer !== 'unknown' &&
      <View>
        <Text style={styles.boldText}>
          Magnetometer:
        </Text>
        <Text>
          {parking.magnetometer}
        </Text>
      </View>
      }
      <Text style={styles.boldText}>
        Step:
      </Text>
      <Text>
        {parking.stepLabel}
      </Text>
      <Text style={styles.boldText}>
        Distance:
      </Text>
      <Text>
        {parking.distance}
      </Text>
      <Text style={styles.boldText}>
        latitude:
      </Text>
      <Text>
        {parking.latitude}
      </Text>
      <Text style={styles.boldText}>
        longitude:
      </Text>
      <Text>
        {parking.longitude}
      </Text>
      <Text style={styles.boldText}>
        accuracy:
      </Text>
      <Text>
        {parking.accuracy}
      </Text>
      <Text style={styles.boldText}>
        gyroscope:
      </Text>
      <Text>
        {parking.gyroscope}
      </Text>
      <Text style={styles.boldText}>
        Angle Y:
      </Text>
      <Text>
        {parseFloat(parking.angleY).toFixed(3)}
      </Text>
    </View>
  );
};

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
});