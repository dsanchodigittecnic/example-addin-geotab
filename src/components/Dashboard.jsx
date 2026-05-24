import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Button, Waiting, DateInput } from '@geotab/zenith';
import '@geotab/zenith/dist/index.css';
import { t } from '../i18n';

function fmtTime(sec) {
  var h = Math.floor(sec / 3600);
  var m = Math.floor((sec % 3600) / 60);
  return h + 'h ' + m + 'm';
}

function fmtPct(val) {
  return val.toFixed(1) + '%';
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

function Dashboard({ api, state }) {
  var lang = (state && state.language) || 'en';
  var [date, setDate] = useState(todayStr);
  var [rows, setRows] = useState(null);
  var [error, setError] = useState(null);
  var [loading, setLoading] = useState(true);
  var [sortKey, setSortKey] = useState('idlePct');
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
      0,
      0,
      0
    );
    var toDate = new Date(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate(),
      23,
      59,
      59
    );

    api.multiCall(
      [
        ['Get', { typeName: 'Device' }],
        [
          'Get',
          {
            typeName: 'Trip',
            search: {
              fromDate: fromDate.toISOString(),
              toDate: toDate.toISOString(),
            },
          },
        ],
        [
          'Get',
          {
            typeName: 'StatusData',
            search: {
              diagnosticSearch: { id: 'DiagnosticFuelLevelId' },
              fromDate: fromDate.toISOString(),
              toDate: toDate.toISOString(),
            },
          },
        ],
      ],
      function (results) {
        var devices = results[0];
        var trips = results[1];
        var statusData = results[2];

        var deviceMap = {};
        devices.forEach(function (d) {
          deviceMap[d.id] = d;
        });

        var fuelMap = {};
        statusData.forEach(function (s) {
          var devId = s.device.id;
          var dt = new Date(s.dateTime).getTime();
          if (!fuelMap[devId] || dt > fuelMap[devId].time) {
            fuelMap[devId] = { time: dt, value: Number(s.data) };
          }
        });

        var totals = {};
        trips.forEach(function (t) {
          var devId = t.device.id;
          if (!totals[devId]) {
            totals[devId] = {
              idleDuration: 0,
              tripDuration: 0,
            };
          }
          var tripSec = 0;
          if (t.start && t.stop) {
            var ms =
              new Date(t.stop).getTime() -
              new Date(t.start).getTime();
            if (!isNaN(ms)) tripSec = ms / 1000;
          }
          var idleVal = t.idlingDuration;
          var idleSec = 0;
          if (typeof idleVal === 'number') {
            idleSec = idleVal;
          } else if (idleVal && idleVal.totalSeconds) {
            idleSec = idleVal.totalSeconds;
          }
          totals[devId].idleDuration += idleSec;
          totals[devId].tripDuration += tripSec;
        });

        var result = [];
        Object.keys(totals).forEach(function (devId) {
          var dev = deviceMap[devId];
          if (!dev) return;
          var t = totals[devId];
          var pct =
            t.tripDuration > 0
              ? (t.idleDuration / t.tripDuration) * 100
              : 0;
          result.push({
            id: devId,
            name: dev.name || '--',
            serial: dev.serialNumber || '--',
            tripDuration: t.tripDuration,
            idleDuration: t.idleDuration,
            idlePct: pct,
            fuelLevel: fuelMap[devId] ? fuelMap[devId].value : null,
          });
        });

        setRows(result);
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
      setSortDir(key === 'idlePct' ? 'desc' : 'asc');
    }
  }

  function sortArrow(key) {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  }

  var sorted = rows
    ? [].concat(rows).sort(function (a, b) {
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

  var totalFleetIdle = rows
    ? rows.reduce(function (s, r) {
        return s + r.idleDuration;
      }, 0)
    : 0;
  var totalFleetTrip = rows
    ? rows.reduce(function (s, r) {
        return s + r.tripDuration;
      }, 0)
    : 0;
  var fleetIdlePct =
    totalFleetTrip > 0
      ? (totalFleetIdle / totalFleetTrip) * 100
      : 0;

  var fuelLevels = rows
    ? rows
        .map(function (r) {
          return r.fuelLevel;
        })
        .filter(function (v) {
          return v !== null && v !== undefined;
        })
    : [];
  var avgFuel =
    fuelLevels.length > 0
      ? fuelLevels.reduce(function (s, v) {
          return s + v;
        }, 0) / fuelLevels.length
      : null;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>{t(lang, 'appTitle')}</h1>
        <Button variant="primary" onClick={loadData}>
          {t(lang, 'refresh')}
        </Button>
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
              <div style={styles.cardLabel}>{t(lang, 'tripTime')}</div>
              <div style={styles.cardValue}>
                {fmtTime(totalFleetTrip)}
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>{t(lang, 'idleTime')}</div>
              <div style={styles.cardValue}>
                {fmtTime(totalFleetIdle)}
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>{t(lang, 'idlePercent')}</div>
              <div style={styles.cardValue}>
                {fmtPct(fleetIdlePct)}
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>{t(lang, 'fuel')}</div>
              <div style={styles.cardValue}>
                {avgFuel !== null ? avgFuel.toFixed(1) + '%' : '--'}
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
                    ...(sortKey === 'tripDuration'
                      ? styles.thActive
                      : {}),
                  }}
                  onClick={function () {
                    toggleSort('tripDuration');
                  }}
                >
                  {t(lang, 'tripTime')}
                  {sortArrow('tripDuration')}
                </th>
                <th
                  style={{
                    ...styles.th,
                    textAlign: 'right',
                    ...(sortKey === 'idleDuration'
                      ? styles.thActive
                      : {}),
                  }}
                  onClick={function () {
                    toggleSort('idleDuration');
                  }}
                >
                  {t(lang, 'idleTime')}
                  {sortArrow('idleDuration')}
                </th>
                <th
                  style={{
                    ...styles.th,
                    textAlign: 'right',
                    ...(sortKey === 'idlePct' ? styles.thActive : {}),
                  }}
                  onClick={function () {
                    toggleSort('idlePct');
                  }}
                >
                  {t(lang, 'idlePercent')}
                  {sortArrow('idlePct')}
                </th>
                <th
                  style={{
                    ...styles.th,
                    textAlign: 'right',
                    ...(sortKey === 'fuelLevel' ? styles.thActive : {}),
                  }}
                  onClick={function () {
                    toggleSort('fuelLevel');
                  }}
                >
                  {t(lang, 'fuel')}
                  {sortArrow('fuelLevel')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.emptyState}>
                    {t(lang, 'noData')}
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
                      <td style={styles.tdRight}>
                        {fmtTime(r.tripDuration)}
                      </td>
                      <td style={styles.tdRight}>
                        {fmtTime(r.idleDuration)}
                      </td>
                      <td style={styles.tdRight}>
                        {fmtPct(r.idlePct)}
                      </td>
                      <td style={styles.tdRight}>
                        {r.fuelLevel !== null
                          ? r.fuelLevel.toFixed(1) + '%'
                          : '--'}
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

export default Dashboard;
