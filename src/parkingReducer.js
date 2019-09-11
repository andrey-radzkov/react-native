export const parkingReducer = (state = {}, action) => {
    switch (action.type) {
        case 'smth':
            return {...state, masterData: action.masterData};
        default:
            return state;
    }
};