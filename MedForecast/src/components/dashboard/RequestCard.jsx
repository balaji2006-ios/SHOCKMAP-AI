import { Hospital, Clock, AlertCircle, Phone, MapPin, CheckCircle } from 'lucide-react';

export default function RequestCard({ request, distance, isOwn, onRespond, onFulfill, onCancel }) {
  const getUrgencyStyle = (urgency) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'matched':
        return 'bg-green-100 text-green-800';
      case 'fulfilled':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMinutes = Math.floor((now - created) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm hover:shadow-md transition p-4 border-l-4 ${
      request.urgency === 'critical' ? 'border-red-500' :
      request.urgency === 'high' ? 'border-orange-500' :
      'border-blue-500'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Hospital className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-800 truncate">
              {request.requestingHospitalName}
            </h4>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusStyle(request.status)}`}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getUrgencyStyle(request.urgency)}`}>
                {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
              </span>
            </div>
          </div>
        </div>
        {distance && (
          <div className="text-right flex-shrink-0 ml-2">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="font-semibold">{distance} km</span>
            </div>
          </div>
        )}
      </div>

      {/* Request Details */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Needs</p>
            <p className="text-lg font-bold text-gray-800">
              {request.quantity} × {request.resourceName}
            </p>
          </div>
          {request.urgency === 'critical' && (
            <AlertCircle className="w-8 h-8 text-red-500 animate-pulse" />
          )}
        </div>
        
        {request.notes && (
          <p className="text-sm text-gray-600 mt-2 border-t border-gray-200 pt-2">
            "{request.notes}"
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div className="flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          <span>{getTimeAgo(request.createdAt)}</span>
        </div>
        {request.phone && !isOwn && request.status === 'open' && (
          <div className="flex items-center text-blue-600">
            <Phone className="w-3 h-3 mr-1" />
            <span>{request.phone}</span>
          </div>
        )}
      </div>

      {/* Matched Info */}
      {request.status === 'matched' && request.respondingHospitalName && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
          <div className="flex items-center text-sm">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-green-800">
              <span className="font-semibold">{request.respondingHospitalName}</span> is coordinating
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        {!isOwn && request.status === 'open' && onRespond && (
          <button
            onClick={() => onRespond(request)}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
          >
            Offer Help
          </button>
        )}

        {isOwn && request.status === 'matched' && onFulfill && (
          <button
            onClick={() => onFulfill(request.id)}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition font-medium text-sm"
          >
            Mark as Fulfilled
          </button>
        )}

        {isOwn && request.status === 'open' && onCancel && (
          <button
            onClick={() => onCancel(request.id)}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition font-medium text-sm"
          >
            Cancel Request
          </button>
        )}

        {request.status === 'fulfilled' && (
          <div className="flex-1 bg-gray-100 text-gray-600 py-2 px-4 rounded-lg text-center font-medium text-sm">
            Completed
          </div>
        )}
      </div>
    </div>
  );
}