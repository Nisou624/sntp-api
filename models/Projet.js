// models/Projet.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // Notez la déstructuration avec {}

const Projet = sequelize.define('Projet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  titre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Le titre est requis'
      },
      len: {
        args: [3, 255],
        msg: 'Le titre doit contenir entre 3 et 255 caractères'
      }
    }
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La catégorie est requise'
      },
      isIn: {
        args: [['routes', 'batiments', 'ouvrages', 'hydraulique', 'industriel']],
        msg: 'Catégorie invalide'
      }
    }
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'L\'image est requise'
      }
    }
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La localisation est requise'
      }
    }
  },
  year: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'L\'année est requise'
      }
    }
  },
  status: {
    type: DataTypes.ENUM('completed', 'in_progress'),
    defaultValue: 'in_progress',
    allowNull: false,
    validate: {
      isIn: {
        args: [['completed', 'in_progress']],
        msg: 'Statut invalide'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La description est requise'
      }
    }
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    validate: {
      isDecimal: {
        msg: 'La latitude doit être un nombre décimal valide'
      },
      min: {
        args: [-90],
        msg: 'La latitude doit être entre -90 et 90'
      },
      max: {
        args: [90],
        msg: 'La latitude doit être entre -90 et 90'
      }
    }
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    validate: {
      isDecimal: {
        msg: 'La longitude doit être un nombre décimal valide'
      },
      min: {
        args: [-180],
        msg: 'La longitude doit être entre -180 et 180'
      },
      max: {
        args: [180],
        msg: 'La longitude doit être entre -180 et 180'
      }
    }
  }
}, {
  tableName: 'projets',
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: 'updatedat',
  indexes: [
    {
      name: 'idx_category',
      fields: ['category']
    },
    {
      name: 'idx_status',
      fields: ['status']
    },
    {
      name: 'idx_year',
      fields: ['year']
    }
  ]
});

// Méthode d'instance pour formater la réponse JSON
Projet.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Formater les dates au format ISO
  if (values.createdat) {
    values.createdAt = new Date(values.createdat).toISOString();
    delete values.createdat;
  }
  
  if (values.updatedat) {
    values.updatedAt = new Date(values.updatedat).toISOString();
    delete values.updatedat;
  }
  
  // Convertir les coordonnées en tableau pour le frontend
  if (values.latitude && values.longitude) {
    values.coordinates = [parseFloat(values.latitude), parseFloat(values.longitude)];
  }
  
  return values;
};

// Méthodes statiques
Projet.getStatistics = async function() {
  const total = await this.count();
  const completed = await this.count({ where: { status: 'completed' } });
  const inProgress = await this.count({ where: { status: 'in_progress' } });
  
  // Statistiques par catégorie
  const { Op } = require('sequelize');
  const routes = await this.count({ where: { category: 'routes' } });
  const batiments = await this.count({ where: { category: 'batiments' } });
  const ouvrages = await this.count({ where: { category: 'ouvrages' } });
  const hydraulique = await this.count({ where: { category: 'hydraulique' } });
  const industriel = await this.count({ where: { category: 'industriel' } });
  
  return {
    total,
    completed,
    inProgress,
    byCategory: {
      routes,
      batiments,
      ouvrages,
      hydraulique,
      industriel
    }
  };
};

module.exports = Projet;

