import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Button, Waiting, TextInput } from '@geotab/zenith';
import '@geotab/zenith/dist/index.css';
import { t } from '../i18n';

var styles = {
  page: {
    padding: '24px',
    fontFamily: 'Roboto, Segoe UI, sans-serif',
    color: 'var(--text-primary)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 500,
    margin: 0,
  },
  sessionInfo: {
    marginBottom: '24px',
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  grid: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
  },
  card: {
    flex: 1,
    background: 'var(--backgrounds-main)',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  cardLabel: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginBottom: '8px',
  },
  cardValue: {
    fontSize: '2em',
    fontWeight: 700,
    color: 'var(--action-primary--default)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '16px',
  },
  th: {
    padding: '12px',
    borderBottom: '1px solid var(--borders-general)',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid var(--borders-general)',
    fontSize: '14px',
  },
  clickableRow: {
    cursor: 'pointer',
  },
  emptyState: {
    padding: '24px',
    textAlign: 'center',
    color: 'var(--text-secondary)',
  },
  loadingWrap: {
    display: 'flex',
    justifyContent: 'center',
    padding: '48px',
  },
  searchWrap: {
    marginBottom: '8px',
  },
};

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
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>{t(lang, 'appTitle')}</h1>
        <Button variant="primary" onClick={loadData}>
          {t(lang, 'refresh')}
        </Button>
      </div>

      {session && (
        <div style={styles.sessionInfo}>
          {t(lang, 'connectedAs')}: <strong>{session.userName}</strong> &mdash;{' '}
          {t(lang, 'database')}: <strong>{session.database}</strong>
        </div>
      )}

      {error && (
        <Alert variant="error" style={{ marginBottom: '16px' }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <div style={styles.loadingWrap}>
          <Waiting size="large" />
        </div>
      ) : (
        <>
          <div style={styles.grid}>
            <div style={styles.card}>
              <div style={styles.cardLabel}>{t(lang, 'totalVehicles')}</div>
              <div style={styles.cardValue}>
                {vehicles ? vehicles.length : '--'}
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>{t(lang, 'totalDrivers')}</div>
              <div style={styles.cardValue}>
                {drivers ? drivers.length : '--'}
              </div>
            </div>
          </div>

          <div style={styles.searchWrap}>
            <TextInput
              label={t(lang, 'vehicles')}
              value={search}
              onChange={function (e) {
                setSearch(e.target.value);
              }}
              placeholder={t(lang, 'vehicles') + '...'}
            />
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{t(lang, 'vehicles')}</th>
                <th style={styles.th}>Serial</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan="2" style={styles.emptyState}>
                    {vehicles && vehicles.length === 0
                      ? t(lang, 'loading')
                      : t(lang, 'error')}
                  </td>
                </tr>
              ) : (
                filteredVehicles.map(function (v) {
                  return (
                    <tr
                      key={v.id}
                      style={styles.clickableRow}
                      onClick={function () {
                        window.parent.location.hash = 'device,id:' + v.id;
                      }}
                      onMouseEnter={function (e) {
                        e.currentTarget.style.backgroundColor =
                          'var(--backgrounds-hover)';
                      }}
                      onMouseLeave={function (e) {
                        e.currentTarget.style.backgroundColor = '';
                      }}
                    >
                      <td style={styles.td}>{v.name || '--'}</td>
                      <td style={styles.td}>{v.serialNumber || '--'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default Dashboard;
