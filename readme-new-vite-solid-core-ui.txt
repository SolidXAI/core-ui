# 1 Build solid-core-ui locally and pack it (run from solid-core-ui, make sure dev branch is checked out)
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item dist -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item solidstarters-solid-core-ui-1.1.211.tgz -Force -ErrorAction SilentlyContinue

npm install
npm run build
npm pack

# 2 Link solid-core-ui into mswipe-erp new-solid-ui project (run from mswipe-erp\new-solid-ui)

Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue
Remove-Item node_modules\@solidstarters -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item dist -Recurse -Force -ErrorAction SilentlyContinue

npm install "$env:USERPROFILE\Code\javascript\solid-core-ui\solidstarters-solid-core-ui-1.1.211.tgz"
npm run build



# 1 Build solid-core-ui locally and pack it (run from solid-core-ui, make sure dev branch is checked out)
sudo rm -rf node_modules;
sudo rm -rf dist;
sudo rm solidstarters-solid-core-ui-1.1.211.tgz;

npm i;
npm run build;
npm pack;


# 2 Link solid-core-ui into mswipe-erp new-solid-ui project (run from mswipe-erp\new-solid-ui)
sudo rm package-lock.json;
sudo rm -rf node_modules/@solidstarters;
sudo rm -rf dist;

# make sure to change the path below to your local path where solid-core-ui is located
npm i ~/Code/javascript/solid-core-ui/solidstarters-solid-core-ui-1.1.211.tgz;
npm run build;
