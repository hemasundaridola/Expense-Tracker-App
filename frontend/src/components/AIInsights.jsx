import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function AIInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await api.get('/ai/insights');
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load AI insights');
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h2 className="font-semibold text-lg mb-2">🤖 AI Insights</h2>
      {loading && <p className="text-sm text-gray-500">Analyzing your spending...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {data && (
        <div className="space-y-3 text-sm">
          {data.insights && <p>{data.insights}</p>}
          {data.prediction && (
            <div>
              <h3 className="font-medium">Prediction</h3>
              <p>{data.prediction}</p>
            </div>
          )}
          {data.anomalies?.length > 0 && (
            <div>
              <h3 className="font-medium">Unusual Activity</h3>
              <ul className="list-disc list-inside">
                {data.anomalies.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {data.savingsSuggestions?.length > 0 && (
            <div>
              <h3 className="font-medium">Savings Suggestions</h3>
              <ul className="list-disc list-inside">
                {data.savingsSuggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
