const translations = {
  en: {
    appTitle: 'Fleet Dashboard',
    loading: 'Loading...',
    error: 'An error occurred',
    vehicles: 'Vehicles',
    drivers: 'Drivers',
    totalVehicles: 'Total Vehicles',
    totalDrivers: 'Total Drivers',
    refresh: 'Refresh',
    connectedAs: 'Connected as',
    database: 'Database',
  },
  es: {
    appTitle: 'Panel de Flota',
    loading: 'Cargando...',
    error: 'Ocurrió un error',
    vehicles: 'Vehículos',
    drivers: 'Conductores',
    totalVehicles: 'Total de Vehículos',
    totalDrivers: 'Total de Conductores',
    refresh: 'Actualizar',
    connectedAs: 'Conectado como',
    database: 'Base de datos',
  },
  fr: {
    appTitle: 'Tableau de Bord',
    loading: 'Chargement...',
    error: 'Une erreur est survenue',
    vehicles: 'Véhicules',
    drivers: 'Conducteurs',
    totalVehicles: 'Total Véhicules',
    totalDrivers: 'Total Conducteurs',
    refresh: 'Actualiser',
    connectedAs: 'Connecté en tant que',
    database: 'Base de données',
  },
};

export function t(lang, key) {
  var l = translations[lang] || translations.en;
  return l[key] || translations.en[key] || key;
}

export default translations;
