export const parkingReducer = (state = { lastPosition: 'unknown',
                                                distance: 'unknown',
                                                latitude: 'unknown',
                                                longitude: 'unknown',
                                                accuracy: 'unknown',
                                                gyroscope: 'unknown',
                                                reducer: 'reducer',
                                                angleY: 0.0,
                                                stepLabel: "Not started",}, action) => {
    switch (action.type) {
        case 'smth':
            return {...state, masterData: action.masterData};
        default:
            return state;
    }
};