export const getRideStatus = (ride) => {
    const parseAsUTC = (dateStr) => {
        if (!dateStr) return new Date();
        let isoStr = dateStr.replace(' ', 'T');
        if (!isoStr.endsWith('Z') && !isoStr.includes('+') && !isoStr.includes('-', 10)) {
            isoStr = isoStr.split('.')[0] + 'Z';
        }
        return new Date(isoStr);
    };

    const scheduledTime = parseAsUTC(ride.scheduledFor).getTime();
    const fifteenMinutesFromNow = Date.now() + 15 * 60 * 1000;

    return ride.canceled ? 'canceled' :
        ride.dropOffTime ? 'completed' :
            ride.pickupTime && !ride.dropOffTime ? 'inProgress' :
                !ride.pickupTime && ((!ride.reassigned && ride.assignedToId) || (ride.reassigned && ride.reassignedToId))
                    ? scheduledTime > fifteenMinutesFromNow ? 'scheduled' : 'arriving' :
                    (!ride.reassigned && !ride.assignedToId) || (ride.reassigned && !ride.reassignedToId) ? 'open'
                        : 'unknown';
}

export const getRideStatusColor = (status) => {
    return status === 'canceled' ? 'error' :
        status === 'open' ? 'primary' :
            status === 'arriving' ? 'warning' :
                status === 'inProgress' ? 'default' :
                    status === 'completed' ? 'success' :
                        status === 'scheduled' ? 'warning' :

                            'default';
}

export const getRideStatusStyle = (status) => {
    if (status === 'inProgress' || status === 'Driving') {
        return {
            backgroundColor: '#FDD835',
            color: '#000',
            fontWeight: 'bold'
        };
    }
    return {};
}

export const getDriverStatusColor = (status) => {
    return status === 'No Driver Found' ? 'error' :
        status === 'Inactive' ? 'error' :
            status === 'Available' ? 'success' :
                status === 'En-Route' ? 'warning' :
                    status === 'Driving' ? 'default' :
                        'default';

}