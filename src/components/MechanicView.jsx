import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Button, Waiting, DateInput, Table } from '@geotab/zenith';
import '@geotab/zenith/dist/index.css';
import { t } from '../i18n';

function fmtDate(iso) {
  if (!iso) return '--';
  var d = new Date(iso);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleString();
}

function todayStr() {
  var d = new Date();
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

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
  filters: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-end',
    marginBottom: '24px',
  },
  summary: {
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
  },
  th: {
    padding: '12px',
    borderBottom: '2px solid var(--borders-general)',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    userSelect: 'none',
  },
  thActive: {
    color: 'var(--action-primary--default)',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid var(--borders-general)',
    fontSize: '14px',
  },
  tdRight: {
    padding: '12px',
    borderBottom: '1px solid var(--borders-general)',
    fontSize: '14px',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
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
};

function MechanicView({ api, lang, onBack }) {
  var [date, setDate] = useState(todayStr);
  var [data, setData] = useState(null);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState(null);
  var [sortSettings, setSortSettings] = useState(null);

  var sortable = sortSettings
    ? { value: sortSettings, onChange: function (s) { setSortSettings(s); } }
    : undefined;

  var columns = [
    {
      id: 'name',
      name: 'name',
      header: t(lang, 'vehicle'),
      sortable: true,
      meta: { defaultWidth: 200 },
      render: function (entity) {
        return React.createElement('span', {
          style: { cursor: 'pointer', color: 'var(--text-hyperlink)' },
          onClick: function () {
            window.parent.location.hash = 'device,id:' + entity.id;
          },
        }, entity.name);
      },
    },
    {
      id: 'serial',
      name: 'serial',
      header: t(lang, 'serial'),
      sortable: true,
      meta: { defaultWidth: 150 },
    },
    {
      id: 'faultCount',
      name: 'faultCount',
      header: t(lang, 'faultCount'),
      sortable: true,
      meta: { defaultWidth: 100 },
    },
    {
      id: 'latestFault',
      name: 'latestFault',
      header: t(lang, 'latestFault'),
      sortable: true,
      meta: { defaultWidth: 200 },
    },
    {
      id: 'latestDate',
      name: 'latestDate',
      header: t(lang, 'latestDate'),
      sortable: true,
      meta: { defaultWidth: 180 },
      render: function (entity) {
        return fmtDate(entity.latestDate);
      },
    },
  ];

  var sortedRows = data
    ? [].concat(data).sort(function (a, b) {
        var key = sortSettings ? sortSettings.sortColumn : 'faultCount';
        var dir = sortSettings ? sortSettings.sortDirection : 'desc';
        var va = a[key];
        var vb = b[key];
        if (typeof va === 'string') {
          return dir === 'asc'
            ? va.localeCompare(vb)
            : vb.localeCompare(va);
        }
        return dir === 'asc' ? va - vb : vb - va;
      })
    : [];

  var totalDevices = data ? data.length : 0;
  var totalFaults = data
    ? data.reduce(function (s, r) {
        return s + r.faultCount;
      }, 0)
    : 0;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>{t(lang, 'mechanicTitle')}</h1>
        <div>
          <Button
            variant="secondary"
            onClick={onBack}
            style={{ marginRight: '8px' }}
          >
            {t(lang, 'back')}
          </Button>
          <Button variant="primary" onClick={loadData}>
            {t(lang, 'refresh')}
          </Button>
        </div>
      </div>

      <div style={styles.filters}>
        <div style={{ width: '200px' }}>
          <DateInput
            label={t(lang, 'date')}
            value={date}
            onChange={function (v) {
              if (v) setDate(v);
            }}
            disableFutureDates
          />
        </div>
      </div>

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
          <div style={styles.summary}>
            <div style={styles.card}>
              <div style={styles.cardLabel}>
                {t(lang, 'devicesWithFaults')}
              </div>
              <div style={styles.cardValue}>{totalDevices}</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>{t(lang, 'totalFaults')}</div>
              <div style={styles.cardValue}>{totalFaults}</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>{t(lang, 'avgFaults')}</div>
              <div style={styles.cardValue}>
                {totalDevices > 0
                  ? (totalFaults / totalDevices).toFixed(1)
                  : '0'}
              </div>
            </div>
          </div>

          <Table
            entities={sortedRows}
            columns={columns}
            sortable={sortable}
            flexible={{ pageName: 'mechanic-table' }}
            height="500px"
          >
            <Table.Empty>
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                {t(lang, 'noFaults')}
              </div>
            </Table.Empty>
          </Table>
        </>
      )}
    </div>
  );
}

export default MechanicView;
