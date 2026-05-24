import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Button, Waiting, DateInput } from '@geotab/zenith';
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
  var [sortKey, setSortKey] = useState('faultCount');
  var [sortDir, setSortDir] = useState('desc');

  var loadData = useCallback(function () {
    setLoading(true);
    setError(null);

    var parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      parsed = new Date();
    }
    var fromDate = new Date(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate(),
      0, 0, 0
    );
    var toDate = new Date(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate(),
      23, 59, 59
    );

    api.multiCall(
      [
        ['Get', { typeName: 'Device' }],
        [
          'Get',
          {
            typeName: 'FaultData',
            search: {
              fromDate: fromDate.toISOString(),
              toDate: toDate.toISOString(),
            },
          },
        ],
      ],
      function (results) {
        var devices = results[0];
        var faults = results[1];

        var deviceMap = {};
        devices.forEach(function (d) {
          deviceMap[d.id] = d;
        });

        var faultMap = {};
        faults.forEach(function (f) {
          var devId = f.device.id;
          if (!faultMap[devId]) {
            faultMap[devId] = { count: 0, faults: [] };
          }
          faultMap[devId].count++;
          faultMap[devId].faults.push(f);
        });

        var result = [];
        Object.keys(faultMap).forEach(function (devId) {
          var dev = deviceMap[devId];
          if (!dev) return;
          var entry = faultMap[devId];
          var latest = entry.faults.sort(function (a, b) {
            return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime();
          })[0];
          var diagnosticName =
            latest.diagnostic && latest.diagnostic.name
              ? latest.diagnostic.name
              : '--';
          result.push({
            id: devId,
            name: dev.name || '--',
            serial: dev.serialNumber || '--',
            faultCount: entry.count,
            latestFault: diagnosticName,
            latestDate: latest.dateTime,
          });
        });

        setData(result);
        setLoading(false);
      },
      function (err) {
        setError(err.message || t(lang, 'error'));
        setLoading(false);
      }
    );
  }, [api, lang, date]);

  useEffect(function () {
    loadData();
  }, [loadData]);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'faultCount' ? 'desc' : 'asc');
    }
  }

  function sortArrow(key) {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  }

  var sorted = data
    ? [].concat(data).sort(function (a, b) {
        var va = a[sortKey];
        var vb = b[sortKey];
        if (typeof va === 'string') {
          return sortDir === 'asc'
            ? va.localeCompare(vb)
            : vb.localeCompare(va);
        }
        return sortDir === 'asc' ? va - vb : vb - va;
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

          <table style={styles.table}>
            <thead>
              <tr>
                <th
                  style={{
                    ...styles.th,
                    ...(sortKey === 'name' ? styles.thActive : {}),
                  }}
                  onClick={function () {
                    toggleSort('name');
                  }}
                >
                  {t(lang, 'vehicle')}
                  {sortArrow('name')}
                </th>
                <th
                  style={{
                    ...styles.th,
                    ...(sortKey === 'serial' ? styles.thActive : {}),
                  }}
                  onClick={function () {
                    toggleSort('serial');
                  }}
                >
                  {t(lang, 'serial')}
                  {sortArrow('serial')}
                </th>
                <th
                  style={{
                    ...styles.th,
                    textAlign: 'right',
                    ...(sortKey === 'faultCount'
                      ? styles.thActive
                      : {}),
                  }}
                  onClick={function () {
                    toggleSort('faultCount');
                  }}
                >
                  {t(lang, 'faultCount')}
                  {sortArrow('faultCount')}
                </th>
                <th
                  style={{
                    ...styles.th,
                    ...(sortKey === 'latestFault'
                      ? styles.thActive
                      : {}),
                  }}
                  onClick={function () {
                    toggleSort('latestFault');
                  }}
                >
                  {t(lang, 'latestFault')}
                  {sortArrow('latestFault')}
                </th>
                <th
                  style={{
                    ...styles.th,
                    textAlign: 'right',
                    ...(sortKey === 'latestDate'
                      ? styles.thActive
                      : {}),
                  }}
                  onClick={function () {
                    toggleSort('latestDate');
                  }}
                >
                  {t(lang, 'latestDate')}
                  {sortArrow('latestDate')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan="5" style={styles.emptyState}>
                    {t(lang, 'noFaults')}
                  </td>
                </tr>
              ) : (
                sorted.map(function (r) {
                  return (
                    <tr
                      key={r.id}
                      style={styles.clickableRow}
                      onClick={function () {
                        window.parent.location.hash =
                          'device,id:' + r.id;
                      }}
                      onMouseEnter={function (e) {
                        e.currentTarget.style.backgroundColor =
                          'var(--backgrounds-hover)';
                      }}
                      onMouseLeave={function (e) {
                        e.currentTarget.style.backgroundColor = '';
                      }}
                    >
                      <td style={styles.td}>{r.name}</td>
                      <td style={styles.td}>{r.serial}</td>
                      <td style={styles.tdRight}>{r.faultCount}</td>
                      <td style={styles.td}>{r.latestFault}</td>
                      <td style={styles.tdRight}>
                        {fmtDate(r.latestDate)}
                      </td>
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

export default MechanicView;
