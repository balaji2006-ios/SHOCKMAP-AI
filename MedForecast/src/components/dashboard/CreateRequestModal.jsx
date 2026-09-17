import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

export default function CreateRequestModal({ onClose, onSubmit, hospitalProfile, resources }) {
  const [formData, setFormData] = useState({
    resourceType: 'bed',
    resourceName: 'ICU Beds',
    quantity: 1,
    urgency: 'high',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resourceOptions = [
    { type: 'bed', name: 'ICU Beds' },
    { type: 'bed', name: 'General Beds' },
    { type: 'equipment', name: 'Ventilators' },
    { type: 'blood', name: 'Blood Units (O+)' },
    { type: 'blood', name: 'Blood Units (A+)' },
    { type: 'blood', name: 'Blood Units (B+)' },
    { type: 'blood', name: 'Blood Units (AB+)' },
    { type: 'doctor', name: 'Doctors' }
  ];

  const handleResourceChange = (e) => {
    const selectedOption = resourceOptions.find(r => r.name === e.target.value);
    setFormData(prev => ({
      ...prev,
      resourceName: e.target.value,
      resourceType: selectedOption ? selectedOption.type : 'bed'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!hospitalProfile || !hospitalProfile.latitude || !hospitalProfile.longitude) {
      setError('Please complete your hospital profile with location before creating requests.');
      setLoading(false);
      return;
    }

    if (formData.quantity < 1 || formData.quantity > 100) {
      setError('Quantity must be between 1 and 100');
      setLoading(false);
      return;
    }

    try {
      await onSubmit({
        ...formData,
        quantity: parseInt(formData.quantity)
      });
      onClose();
    } catch (err) {
      setError('Failed to create request: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Request Resources</h3>
            <p className="text-sm text-gray-500 mt-1">Post urgent resource needs to the network</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Resource Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resource Needed *
              </label>
              <select
                value={formData.resourceName}
                onChange={handleResourceChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {resourceOptions.map(option => (
                  <option key={option.name} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity Needed *
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                min="1"
                max="100"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter quantity"
                required
              />
            </div>

            {/* Urgency Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level *
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition ${
                  formData.urgency === 'critical' 
                    ? 'border-red-600 bg-red-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    name="urgency"
                    value="critical"
                    checked={formData.urgency === 'critical'}
                    onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
                    className="mr-2"
                  />
                  <span className="font-medium text-sm">Critical</span>
                </label>
                
                <label className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition ${
                  formData.urgency === 'high' 
                    ? 'border-orange-600 bg-orange-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    name="urgency"
                    value="high"
                    checked={formData.urgency === 'high'}
                    onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
                    className="mr-2"
                  />
                  <span className="font-medium text-sm">High</span>
                </label>
                
                <label className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition ${
                  formData.urgency === 'normal' 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    name="urgency"
                    value="normal"
                    checked={formData.urgency === 'normal'}
                    onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
                    className="mr-2"
                  />
                  <span className="font-medium text-sm">Normal</span>
                </label>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Patient condition, special requirements, etc."
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Note:</span> Your request will be visible to all hospitals in the network. 
                Nearby hospitals will be able to respond and coordinate with you directly.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Post Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}