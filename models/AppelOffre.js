const fs = require('fs');
const path = require('path');

// Chemin du fichier JSON pour stocker les appels d'offres
const dataFilePath = path.join(__dirname, '..', 'data', 'appels-offres.json');

// Créer le dossier data s'il n'existe pas
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialiser le fichier s'il n'existe pas
if (!fs.existsSync(dataFilePath)) {
  fs.writeFileSync(dataFilePath, JSON.stringify([]), 'utf8');
}

class AppelOffre {
  // Lire tous les appels d'offres
  static getAll() {
    try {
      const data = fs.readFileSync(dataFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Erreur lors de la lecture des appels d\'offres:', error);
      return [];
    }
  }

  // Sauvegarder les appels d'offres
  static save(data) {
    try {
      fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des appels d\'offres:', error);
      return false;
    }
  }

  // Obtenir un appel d'offre par ID
  static getById(id) {
    const appelsOffres = this.getAll();
    return appelsOffres.find(ao => ao.id === id);
  }

  // Créer un nouvel appel d'offre
  static create(data) {
    const appelsOffres = this.getAll();
    const newAppelOffre = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    appelsOffres.push(newAppelOffre);
    this.save(appelsOffres);
    return newAppelOffre;
  }

  // Mettre à jour un appel d'offre
  static update(id, data) {
    const appelsOffres = this.getAll();
    const index = appelsOffres.findIndex(ao => ao.id === id);
    
    if (index === -1) return null;

    appelsOffres[index] = {
      ...appelsOffres[index],
      ...data,
      id: appelsOffres[index].id, // Garder l'ID original
      createdAt: appelsOffres[index].createdAt, // Garder la date de création
      updatedAt: new Date().toISOString()
    };

    this.save(appelsOffres);
    return appelsOffres[index];
  }

  // Supprimer un appel d'offre
  static delete(id) {
    const appelsOffres = this.getAll();
    const index = appelsOffres.findIndex(ao => ao.id === id);
    
    if (index === -1) return false;

    // Supprimer le fichier PDF associé si il existe
    const appelOffre = appelsOffres[index];
    if (appelOffre.pdfPath) {
      const fullPath = path.join(__dirname, '..', appelOffre.pdfPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    appelsOffres.splice(index, 1);
    this.save(appelsOffres);
    return true;
  }
}

module.exports = AppelOffre;

