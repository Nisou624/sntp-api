const db = require('../config/database');

class AppelOffre {
  // Récupérer tous les appels d'offres avec filtres optionnels
  static async getAll(filters = {}) {
    try {
      let query = 'SELECT * FROM appels_offres WHERE 1=1';
      const params = [];

      // Filtre par statut
      if (filters.statut) {
        query += ' AND statut = ?';
        params.push(filters.statut);
      }

      // Filtre par type de marché
      if (filters.type_marche) {
        query += ' AND type_marche = ?';
        params.push(filters.type_marche);
      }

      // Filtre par localisation
      if (filters.localisation) {
        query += ' AND localisation LIKE ?';
        params.push(`%${filters.localisation}%`);
      }

      // Recherche par titre ou description
      if (filters.search) {
        query += ' AND (titre LIKE ? OR description LIKE ? OR numero_ao LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
      }

      // Tri
      const orderBy = filters.orderBy || 'date_publication';
      const order = filters.order || 'DESC';
      query += ` ORDER BY ${orderBy} ${order}`;

      // Pagination
      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(parseInt(filters.limit));
        
        if (filters.offset) {
          query += ' OFFSET ?';
          params.push(parseInt(filters.offset));
        }
      }

      const [rows] = await db.pool.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des appels d'offres: ${error.message}`);
    }
  }

  // Récupérer un appel d'offre par ID
  static async getById(id) {
    try {
      const query = 'SELECT * FROM appels_offres WHERE id = ?';
      const [rows] = await db.pool.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l'appel d'offre: ${error.message}`);
    }
  }

  // Récupérer un appel d'offre par numéro
  static async getByNumero(numero_ao) {
    try {
      const query = 'SELECT * FROM appels_offres WHERE numero_ao = ?';
      const [rows] = await db.pool.query(query, [numero_ao]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l'appel d'offre: ${error.message}`);
    }
  }

  // Créer un nouvel appel d'offre
  static async create(data) {
    try {
      const query = `
        INSERT INTO appels_offres (
          numero_ao, titre, description, type_marche, montant_estimatif,
          date_publication, date_limite_depot, date_ouverture_plis, statut,
          localisation, maitre_ouvrage, delai_execution, cautionnement_provisoire,
          documents_requis, contact_email, contact_telephone, fichier_cahier_charges,
          conditions_participation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.pool.query(query, [
        data.numero_ao,
        data.titre,
        data.description || null,
        data.type_marche,
        data.montant_estimatif || null,
        data.date_publication,
        data.date_limite_depot,
        data.date_ouverture_plis || null,
        data.statut || 'Ouvert',
        data.localisation || null,
        data.maitre_ouvrage || null,
        data.delai_execution || null,
        data.cautionnement_provisoire || null,
        data.documents_requis || null,
        data.contact_email || null,
        data.contact_telephone || null,
        data.fichier_cahier_charges || null,
        data.conditions_participation || null
      ]);

      return { id: result.insertId, ...data };
    } catch (error) {
      throw new Error(`Erreur lors de la création de l'appel d'offre: ${error.message}`);
    }
  }

  // Mettre à jour un appel d'offre
  static async update(id, data) {
    try {
      const fields = [];
      const values = [];

      // Construction dynamique de la requête UPDATE
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(data[key]);
        }
      });

      if (fields.length === 0) {
        throw new Error('Aucune donnée à mettre à jour');
      }

      values.push(id);
      const query = `UPDATE appels_offres SET ${fields.join(', ')} WHERE id = ?`;
      
      const [result] = await db.pool.query(query, values);
      
      if (result.affectedRows === 0) {
        throw new Error('Appel d\'offre non trouvé');
      }

      return await this.getById(id);
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour de l'appel d'offre: ${error.message}`);
    }
  }

  // Supprimer un appel d'offre
  static async delete(id) {
    try {
      const query = 'DELETE FROM appels_offres WHERE id = ?';
      const [result] = await db.pool.query(query, [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Appel d\'offre non trouvé');
      }

      return { message: 'Appel d\'offre supprimé avec succès' };
    } catch (error) {
      throw new Error(`Erreur lors de la suppression de l'appel d'offre: ${error.message}`);
    }
  }

  // Obtenir les statistiques
  static async getStatistics() {
    try {
      const queries = {
        total: 'SELECT COUNT(*) as count FROM appels_offres',
        byStatus: 'SELECT statut, COUNT(*) as count FROM appels_offres GROUP BY statut',
        byType: 'SELECT type_marche, COUNT(*) as count FROM appels_offres GROUP BY type_marche',
        totalAmount: 'SELECT SUM(montant_estimatif) as total FROM appels_offres WHERE statut = "Ouvert"'
      };

      const [total] = await db.pool.query(queries.total);
      const [byStatus] = await db.pool.query(queries.byStatus);
      const [byType] = await db.pool.query(queries.byType);
      const [totalAmount] = await db.pool.query(queries.totalAmount);

      return {
        total: total[0].count,
        byStatus,
        byType,
        totalAmount: totalAmount[0].total || 0
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }
}

module.exports = AppelOffre;

