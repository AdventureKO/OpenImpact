import * as storage from './storage';

export async function getFavoritesFromStore() {
  const user = await storage.load('user', null);
  if (!user) return [];
  return (await storage.loadForUser(user, 'favorites', [])) || [];
}

export async function addFavoritesToStore(project) {
  const user = await storage.load('user', null);
  if (!user) throw new Error('not-authenticated');
  const myFavorites = (await storage.loadForUser(user, 'favorites', [])) || [];
  // prevent duplicates by ID
  if (!myFavorites.some(f => f.id === project.id)) {
    myFavorites.push(project);
    await storage.saveForUser(user, 'favorites', myFavorites);
  }
}

export async function checkFavoritesStore(id) {
  const user = await storage.load('user', null);
  if (!user) return false;
  const myFavorites = (await storage.loadForUser(user, 'favorites', [])) || [];
  return myFavorites.some(r => r.id === id);
}

export async function removeFavoritesFromStore(updatedFavorites) {
  const user = await storage.load('user', null);
  if (!user) throw new Error('not-authenticated');
  await storage.saveForUser(user, 'favorites', updatedFavorites || []);
}

export async function getSavedListsFromStore() {
  const user = await storage.load('user', null);
  return (await storage.loadForUser(user, 'myLists', [])) || [];
}

export async function saveListToStore(list) {
  const user = await storage.load('user', null);
  const myLists = (await storage.loadForUser(user, 'myLists', [])) || [];
  myLists.push(list);
  await storage.saveForUser(user, 'myLists', myLists);
}

export async function deleteListFromStore(title) {
  const user = await storage.load('user', null);
  const savedLists = (await storage.loadForUser(user, 'myLists', [])) || [];
  const filteredLists = savedLists.filter(l => l.title !== title);
  await storage.saveForUser(user, 'myLists', filteredLists);
  return filteredLists;
}

export async function getJwt() {
  return await storage.load('charityjwt', null);
}

export async function setJwt(val) {
  return await storage.save('charityjwt', val);
}

export async function getUser() {
  return await storage.load('user', null);
}

export async function setUser(val) {
  try {
    if (val) {
      await storage.save('user', val);
      return true;
    }
    // clear stored user when null/false passed
    await storage.remove('user');
    return true;
  } catch (err) {
    console.warn('localStorage setUser error', err);
    return false;
  }
}

export async function getImage() {
  const user = await storage.load('user', null);
  if (user) return await storage.loadForUser(user, 'profile-picture', null);
  return await storage.load('profile-picture', null);
}

export async function saveImage(val) {
  const user = await storage.load('user', null);
  if (user) return await storage.saveForUser(user, 'profile-picture', val);
  return await storage.save('profile-picture', val);
}

export default {
  getFavoritesFromStore,
  addFavoritesToStore,
  checkFavoritesStore,
  removeFavoritesFromStore,
  getSavedListsFromStore,
  deleteListFromStore,
  saveListToStore,
  getJwt,
  setJwt,
  getUser,
  setUser,
  getImage,
  saveImage,
};
