import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Button, Waiting, TextInput } from '@geotab/zenith';
import '@geotab/zenith/dist/index.css';
import { t } from '../i18n';

function Dashboard({ api, state }) {
  var lang = (state && state.language) || 'en';
  var [session, setSession] = useState(null);
  var [vehicles, setVehicles] = useState(null);
  var [drivers, setDrivers] = useState(null);
  var [error, setError] = useState(null);
  var [loading, setLoading] = useState(true);
  var [search, setSearch] = useState('');

  var loadData = useCallback(function () {
    setLoading(true);
    setError(null);

    api.multiCall(
      [
        ['Get', { typeName: 'Device' }],
        ['Get', { typeName: 'User', search: { isDriver: true } }],
      ],
      function (results) {
        setVehicles(results[0]);
        setDrivers(results[1]);
        setLoading(false);
      },
      function (err) {
        setError(err.message || t(lang, 'error'));
        setLoading(false);
      }
    );

    api.getSession(function (s) {
      setSession(s);
    });
  }, [api, lang]);

  useEffect(function () {
    loadData();
  }, [loadData]);

  var filteredVehicles = vehicles
    ? vehicles.filter(function (v) {
        var name = (v.name || '').toLowerCase();
        var serial = (v.serialNumber || '').toLowerCase();
        var q = search.toLowerCase();
        return name.indexOf(q) !== -1 || serial.indexOf(q) !== -1;
      })
    : [];

  return (
    <div style={{ padding: 'var(--zenith-spacing-lg)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--zenith-spacing-lg)',
        }}
      >
        <h1 style={{ fontSize: 'var(--zenith-font-size-xxl)', margin: 0 }}>
          {t(lang, 'appTitle')}
        </h1>
        <Button variant="primary" onClick={loadData}>
          {t(lang, 'refresh')}
        </Button>
      </div>

      {session && (
        <div
          style={{
            marginBottom: 'var(--zenith-spacing-lg)',
            color: 'var(--zenith-neutral-900)',
          }}
        >
          {t(lang, 'connectedAs')}: <strong>{session.userName}</strong> &mdash;{' '}
          {t(lang, 'database')}: <strong>{session.database}</strong>
        </div>
      )}

      {error && (
        <Alert variant="error" style={{ marginBottom: 'var(--zenith-spacing-md)' }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: 'var(--zenith-spacing-xl)',
          }}
        >
          <Waiting size="large" />
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              gap: 'var(--zenith-spacing-md)',
              marginBottom: 'var(--zenith-spacing-lg)',
            }}
          >
            <StatCard
              label={t(lang, 'totalVehicles')}
              value={vehicles ? vehicles.length : '--'}
            />
            <StatCard
              label={t(lang, 'totalDrivers')}
              value={drivers ? drivers.length : '--'}
            />
          </div>

          <TextInput
            label={t(lang, 'vehicles')}
            value={search}
            onChange={function (e) {
              setSearch(e.target.value);
            }}
            placeholder={t(lang, 'vehicles') + '...'}
          />

          <div style={{ marginTop: 'var(--zenith-spacing-md)' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid var(--zenith-neutral-100)',
                      color: 'var(--zenith-neutral-900)',
                      textAlign: 'left',
                    }}
                  >
                    {t(lang, 'vehicles')}
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid var(--zenith-neutral-100)',
                      color: 'var(--zenith-neutral-900)',
                      textAlign: 'left',
                    }}
                  >
                    Serial
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td
                      colSpan="2"
                      style={{
                        padding: '24px',
                        textAlign: 'center',
                        color: 'var(--zenith-neutral-900)',
                      }}
                    >
                      {vehicles && vehicles.length === 0
                        ? t(lang, 'loading')
                        : t(lang, 'error')}
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map(function (v) {
                    return (
                      <tr key={v.id}>
                        <td
                          style={{
                            padding: '12px',
                            borderBottom:
                              '1px solid var(--zenith-neutral-100)',
                          }}
                        >
                          {v.name || '--'}
                        </td>
                        <td
                          style={{
                            padding: '12px',
                            borderBottom:
                              '1px solid var(--zenith-neutral-100)',
                          }}
                        >
                          {v.serialNumber || '--'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        flex: 1,
        background: 'white',
        padding: 'var(--zenith-spacing-lg)',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          fontSize: 'var(--zenith-font-size-md)',
          color: 'var(--zenith-neutral-900)',
          marginBottom: 'var(--zenith-spacing-sm)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '2em',
          fontWeight: 'bold',
          color: 'var(--zenith-primary)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default Dashboard;
