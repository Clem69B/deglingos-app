'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useCheckManagement } from '@/hooks/useCheckManagement';
import CheckList from './CheckList';
import CheckDepositModal from './CheckDepositModal';

interface CheckTrackerProps {
  onError: (error: string) => void;
}

const CheckTracker: React.FC<CheckTrackerProps> = ({ onError }) => {
  const { undepositedChecks, loading, markAsDeposited, refreshChecks } = useCheckManagement({ onError });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickDepositId, setQuickDepositId] = useState<string | null>(null);

  // Load checks on mount
  useEffect(() => {
    refreshChecks();
  }, [refreshChecks]);

  // Filter checks based on search term
  const filteredChecks = useMemo(() => {
    if (!searchTerm) return undepositedChecks;

    const term = searchTerm.toLowerCase();
    return undepositedChecks.filter(
      (check) =>
        check.patient?.firstName?.toLowerCase().includes(term) ||
        check.patient?.lastName?.toLowerCase().includes(term) ||
        check.invoiceNumber.toLowerCase().includes(term) ||
        check.notes?.toLowerCase().includes(term) ||
        check.total?.toString().includes(term)
    );
  }, [undepositedChecks, searchTerm]);

  const selectedChecks = useMemo(() => {
    return filteredChecks.filter((check) => selectedIds.includes(check.id));
  }, [filteredChecks, selectedIds]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredChecks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredChecks.map((check) => check.id));
    }
  };

  const handleBulkDeposit = () => {
    if (selectedIds.length === 0) return;
    setIsModalOpen(true);
  };

  const handleQuickDeposit = (id: string) => {
    setQuickDepositId(id);
    setSelectedIds([id]);
    setIsModalOpen(true);
  };

  const handleConfirmDeposit = async (depositDate: string) => {
    try {
      await markAsDeposited(selectedIds, depositDate);
      setSelectedIds([]);
      setQuickDepositId(null);
      onError(''); // Clear any previous errors
    } catch (err) {
      console.error('Failed to deposit checks:', err);
      // Error is already handled by the hook
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setQuickDepositId(null);
    if (quickDepositId) {
      setSelectedIds([]);
    }
  };

  const undepositedCount = undepositedChecks.length;

  return (
    <>
      <div className="form-card">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-medium">
              Chèques non encaissés ({undepositedCount})
            </h3>
            {selectedIds.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {selectedIds.length} chèque{selectedIds.length > 1 ? 's' : ''} sélectionné{selectedIds.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {filteredChecks.length > 0 && (
              <>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleSelectAll}
                  disabled={loading}
                >
                  {selectedIds.length === filteredChecks.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleBulkDeposit}
                  disabled={selectedIds.length === 0 || loading}
                >
                  Encaisser sélection ({selectedIds.length})
                </button>
              </>
            )}
          </div>
        </div>

        {undepositedCount > 0 && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Rechercher par patient, montant, notes..."
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-sm text-gray-600">Chargement des chèques...</span>
          </div>
        )}

        {!loading && (
          <CheckList
            checks={filteredChecks}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onQuickDeposit={handleQuickDeposit}
          />
        )}

        {!loading && filteredChecks.length === 0 && searchTerm && (
          <div className="empty-state py-8">
            <p className="empty-state-text">Aucun chèque trouvé pour &quot;{searchTerm}&quot;</p>
          </div>
        )}
      </div>

      <CheckDepositModal
        isOpen={isModalOpen}
        selectedChecks={selectedChecks}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDeposit}
      />
    </>
  );
};

export default CheckTracker;
