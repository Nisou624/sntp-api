// models/Article.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // ⚠️ Destructuration pour obtenir l'instance sequelize

const Article = sequelize.define('Article', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  titre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'titre',
    validate: {
      notEmpty: { msg: 'Le titre est requis' },
      len: {
        args: [3, 255],
        msg: 'Le titre doit contenir entre 3 et 255 caractères'
      }
    }
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: { msg: 'Ce slug existe déjà' },
    field: 'slug',
    validate: {
      notEmpty: { msg: 'Le slug est requis' }
    }
  },
  contenu: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    field: 'contenu',
    validate: {
      notEmpty: { msg: 'Le contenu est requis' }
    }
  },
  extrait: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'extrait'
  },
  auteur: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'auteur'
  },
  imagePrincipale: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'image_principale'
  },
  statut: {
    type: DataTypes.ENUM('brouillon', 'publie', 'archive'),
    defaultValue: 'brouillon',
    allowNull: false,
    field: 'statut',
    validate: {
      isIn: {
        args: [['brouillon', 'publie', 'archive']],
        msg: 'Statut invalide'
      }
    }
  },
  datePublication: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'date_publication'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'tags',
    defaultValue: []
  },
  metaDescription: {
    type: DataTypes.STRING(300),
    allowNull: true,
    field: 'meta_description'
  }
}, {
  tableName: 'articles',
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: 'updatedat',
  indexes: [
    {
      name: 'idx_statut',
      fields: ['statut']
    },
    {
      name: 'idx_date_publication',
      fields: ['date_publication']
    },
    {
      name: 'idx_slug',
      unique: true,
      fields: ['slug']
    }
  ]
});

// Méthode pour formater la réponse JSON
Article.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Formater les dates
  if (values.date_publication) {
    values.datePublication = values.date_publication;
    delete values.date_publication;
  }
  if (values.createdat) {
    values.createdAt = values.createdat;
    delete values.createdat;
  }
  if (values.updatedat) {
    values.updatedAt = values.updatedat;
    delete values.updatedat;
  }

  // Renommer les champs pour camelCase
  if (values.image_principale !== undefined) {
    values.imagePrincipale = values.image_principale;
    delete values.image_principale;
  }
  if (values.meta_description !== undefined) {
    values.metaDescription = values.meta_description;
    delete values.meta_description;
  }

  return values;
};

// Méthodes statiques
Article.getStatistics = async function() {
  const total = await this.count();
  const publies = await this.count({ where: { statut: 'publie' } });
  const brouillons = await this.count({ where: { statut: 'brouillon' } });
  const archives = await this.count({ where: { statut: 'archive' } });

  return {
    total,
    publies,
    brouillons,
    archives
  };
};

module.exports = Article;

