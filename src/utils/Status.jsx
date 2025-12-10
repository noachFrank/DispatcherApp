export const getRideStatus = (ride) => {
    const status = ride.canceled ? 'canceled' :
        !ride.assignedToId ? 'open' :
            !ride.pickupTime && (ride.assignedToId || (ride.reassigned && ride.reassignedToId)) ? 'arriving' :
                ride.pickupTime && !ride.dropOffTime ? 'inProgress' :
                    ride.dropOffTime ? 'completed' : 'unknown';
    return status;

}
export const getRideStatusColor = (status) => {
    return status === 'canceled' ? 'error' :
        status === 'open' ? 'error' :
            status === 'arriving' ? 'warning' :
                status === 'inProgress' ? 'success' :
                    status === 'completed' ? 'primary' :
                        'default';
}

export const getDriverStatusColor = (status) => {
    return status === 'No Driver Found' ? 'error' :
        status === 'Active' ? 'error' :
            status === 'Inactive' ? 'warning' :
                status === 'En-Route' ? 'success' :
                    status === 'Driving' ? 'primary' :
                        'default';

}