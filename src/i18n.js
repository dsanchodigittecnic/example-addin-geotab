const translations = {
  en: {
    appTitle: 'Idle Report',
    loading: 'Loading...',
    error: 'An error occurred',
    vehicle: 'Vehicle',
    serial: 'Serial',
    tripTime: 'Trip Time',
    idleTime: 'Idle Time',
    idlePercent: 'Idle %',
    date: 'Date',
    noData: 'No trips found for this day',
    refresh: 'Refresh',
  },
  es: {
    appTitle: 'Informe de Ralentí',
    loading: 'Cargando...',
    error: 'Ocurrió un error',
    vehicle: 'Vehículo',
    serial: 'Serial',
    tripTime: 'Tiempo de Viaje',
    idleTime: 'Tiempo de Ralentí',
    idlePercent: '% Ralentí',
    date: 'Fecha',
    noData: 'No hay viajes para este día',
    refresh: 'Actualizar',
  },
  fr: {
    appTitle: 'Rapport de Ralenti',
    loading: 'Chargement...',
    error: 'Une erreur est survenue',
    vehicle: 'Véhicule',
    serial: 'Série',
    tripTime: 'Temps de Trajet',
    idleTime: 'Temps de Ralenti',
    idlePercent: '% Ralenti',
    date: 'Date',
    noData: 'Aucun trajet pour ce jour',
    refresh: 'Actualiser',
  },
};

export function t(lang, key) {
  var l = translations[lang] || translations.en;
  return l[key] || translations.en[key] || key;
}

export default translations;
