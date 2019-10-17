export const parkingReducer = (state = {data:{
  lastPosition: 'unknown',
  distance: 'unknown',
  latitude: 'unknown',
  longitude: 'unknown',
  accuracy: 'unknown',
  gyroscope: 'unknown',
  angleY: 0.0,
  stepLabel: "Not started",
  accelerometer: "Not started",
}}, action) => {
  switch (action.type) {
    case 'update':
      return {...state, data: {...state.data, ...action.data}};
    default:
      return state;
  }
};