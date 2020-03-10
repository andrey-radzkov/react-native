export const parkingReducer = (state = {
  data: {
    distance: 'unknown',
    latitude: 'unknown',
    longitude: 'unknown',
    accuracy: 'unknown',
    gyroscope: 'unknown',
    accelerometerString: 'unknown',
    accelerometer: {x: 0, y: 0, z: 0},
    magnetometer: 'unknown',
    angleY: 0.0,
    stepLabel: "Not started",
  }
}, action) => {
  switch (action.type) {
    case 'update':
      return {...state, data: {...state.data, ...action.data}};
    default:
      return state;
  }
};