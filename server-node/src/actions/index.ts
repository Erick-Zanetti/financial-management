import { ActionRegistry } from './registry';
import listReleases from './list-releases.action';
import searchReleases from './search-releases.action';
import getRelease from './get-release.action';
import listCategories from './list-categories.action';
import getDashboardSummary from './get-dashboard-summary.action';
import createRelease from './create-release.action';
import updateRelease from './update-release.action';
import deleteRelease from './delete-release.action';

export const actionRegistry = new ActionRegistry([
  listReleases,
  searchReleases,
  getRelease,
  listCategories,
  getDashboardSummary,
  createRelease,
  updateRelease,
  deleteRelease,
]);
