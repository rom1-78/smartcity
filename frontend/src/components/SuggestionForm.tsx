// frontend/src/components/SuggestionForm.tsx
import React, { useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';

interface SuggestionFormProps {
  onClose?: () => void;
  onSubmitSuccess?: () => void;
}

const SuggestionForm: React.FC<SuggestionFormProps> = ({ onClose, onSubmitSuccess }) => {
  const [formData, setFormData] = useState({
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.message.trim()) {
      setError('Veuillez écrire votre suggestion');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('http://localhost:5000/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: formData.message
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'envoi');
      }

      setSuccess(true);
      setFormData({ message: '' });
      
      setTimeout(() => {
        setSuccess(false);
        if (onSubmitSuccess) onSubmitSuccess();
        if (onClose) onClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi de la suggestion');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-green-600 text-4xl mb-3">✓</div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Suggestion envoyée avec succès !
          </h3>
          <p className="text-green-600 text-sm">
            Merci pour votre contribution à l'amélioration de notre ville intelligente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Faire une suggestion
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Votre suggestion pour améliorer la ville intelligente :
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ message: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Décrivez votre idée d'amélioration, un problème constaté, ou toute suggestion constructive..."
            disabled={loading}
          />
          <div className="text-xs text-gray-500 mt-1">
            {formData.message.length} caractères
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !formData.message.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Envoi...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Envoyer ma suggestion</span>
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded">
        <strong>À savoir :</strong> Votre suggestion sera transmise aux gestionnaires de la ville. 
        Vous pourrez suivre le statut de votre demande dans la section "Mes suggestions".
      </div>
    </div>
  );
};

export default SuggestionForm;