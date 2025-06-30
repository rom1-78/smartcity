#!/bin/bash

# 🧹 Script de nettoyage automatisé - Smart City IoT Project
# Exécuter depuis la racine du projet

echo " Début du nettoyage du projet Smart City IoT..."

# Phase 1: Suppression des fichiers redondants
echo "📁 Phase 1: Suppression des fichiers redondants..."

# Supprimer le fichier de route redondant
if [ -f "backend/src/routes/sensorData.routes.ts" ]; then
    echo " Suppression de backend/src/routes/sensorData.routes.ts"
    rm "backend/src/routes/sensorData.routes.ts"
else
    echo " backend/src/routes/sensorData.routes.ts déjà supprimé"
fi

# Phase 2: Nettoyage du package.json
echo "📦 Phase 2: Nettoyage des dépendances inutiles..."

# Créer une sauvegarde du package.json
cp package.json package.json.backup

# Supprimer la dépendance PostgreSQL (remplacer par sed ou manuellement)
echo "⚠️  Attention: Vérifiez manuellement package.json pour supprimer 'pg': '^8.16.0'"

# Phase 3: Créer la structure de types optimisée
echo "📝 Phase 3: Création de la structure de types..."

# Créer le dossier types s'il n'existe pas
mkdir -p frontend/src/types

# Créer le fichier de types pour les capteurs
cat > frontend/src/types/sensor.types.ts << 'EOF'
// Types pour les capteurs IoT
export interface Sensor {
  id: number;
  name: string;
  type: string;
  location: string;
  latitude?: number;
  longitude?: number;
  status: 'actif' | 'inactif' | 'maintenance';
  installed_at: string;
  serial_number?: string;
  manufacturer?: string;
  model?: string;
  firmware_version?: string;
}

export interface SensorData {
  id: number;
  sensor_id: number;
  value: number;
  unit: string;
  timestamp: string;
}

export interface SensorWithData extends Sensor {
  currentValue?: number;
  currentUnit?: string;
  lastUpdate?: string;
  alertLevel?: 'normal' | 'warning' | 'critical';
}

export type SensorType = 'air_quality' | 'noise' | 'temperature' | 'humidity' | 'traffic' | 'pollution';
export type SensorStatus = 'actif' | 'inactif' | 'maintenance';
EOF

# Créer le fichier de types API
cat > frontend/src/types/api.types.ts << 'EOF'
// Types pour les réponses API
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'gestionnaire' | 'citoyen' | 'chercheur';
  organization?: string;
}

export interface Alert {
  id: number;
  type: 'info' | 'warning' | 'critical';
  message: string;
  sensor_id?: number;
  timestamp: string;
  resolved: boolean;
}

export interface Suggestion {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'reviewed' | 'implemented';
  created_at: string;
  admin_response?: string;
}
EOF

# Créer un fichier index pour faciliter les imports
cat > frontend/src/types/index.ts << 'EOF'
// Export centralisé des types
export * from './sensor.types';
export * from './api.types';
EOF

echo " Fichiers de types créés dans frontend/src/types/"

# Phase 4: Nettoyage des imports et console.log
echo "🧽 Phase 4: Nettoyage du code..."

# Fonction pour supprimer les console.log de debug (attention aux console.error utiles)
cleanup_console_logs() {
    local file="$1"
    if [ -f "$file" ]; then
        # Supprimer uniquement les console.log avec emojis (debug)
        sed -i.bak '/console\.log.*[🔄❌📊🔌]/d' "$file"
        rm "${file}.bak" 2>/dev/null || true
        echo "🧹 Nettoyé: $file"
    fi
}

# Nettoyer les fichiers principaux
cleanup_console_logs "backend/src/controllers/sensor.controller.ts"
cleanup_console_logs "backend/src/index.ts"

# Phase 5: Optimisation des middlewares
echo "⚡ Phase 5: Optimisation des middlewares..."

# Créer une version optimisée des routes (exemple pour suggestion.routes.ts)
cat > temp_suggestion_routes.ts << 'EOF'
// Version optimisée - suggestion.routes.ts
import express from 'express';
import { 
  getSuggestions, 
  getSuggestionById,
  createSuggestion,
  addAdminResponse,
  deleteSuggestion
} from '../controllers/suggestion.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/roleAuth';

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticateToken);

// Routes accessibles à tous les utilisateurs authentifiés
router.get('/', getSuggestions);
router.get('/:id', getSuggestionById);
router.post('/', createSuggestion);

// Routes restreintes aux administrateurs
router.put('/:id/response', requireRole(['admin']), addAdminResponse);
router.delete('/:id', requireRole(['admin']), deleteSuggestion);

export default router;
EOF

echo "📝 Fichier optimisé créé: temp_suggestion_routes.ts"
echo "⚠️  Copiez ce contenu dans backend/src/routes/suggestion.routes.ts"

# Phase 6: Vérification finale
echo "🔍 Phase 6: Vérification finale..."

# Compter les fichiers .ts et .tsx pour statistiques
ts_files=$(find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | wc -l)
echo "📊 Nombre de fichiers TypeScript: $ts_files"

# Vérifier la structure du projet
echo "📁 Structure du projet après nettoyage:"
tree -I 'node_modules|.git|dist|build' -L 3 2>/dev/null || ls -la

echo ""
echo "✨ Nettoyage terminé !"
echo ""
echo "📋 Prochaines étapes manuelles:"
echo "1. Vérifiez package.json et supprimez la dépendance 'pg'"
echo "2. Remplacez le contenu de suggestion.routes.ts par temp_suggestion_routes.ts"
echo "3. Appliquez la même optimisation aux autres fichiers de routes"
echo "4. Mettez à jour les imports dans vos composants React"
echo "5. Testez l'application pour vérifier que tout fonctionne"
echo ""
echo "🎯 Code optimisé et prêt pour l'évaluation M1-DI !"

# Nettoyer le fichier temporaire
rm temp_suggestion_routes.ts 2>/dev/null || true