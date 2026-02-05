# 1 Build core-ui locally and pack it (run from core-ui, make sure dev branch is checked out)
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item dist -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item solidstarters-core-ui-1.1.211.tgz -Force -ErrorAction SilentlyContinue

npm install
npm run build
npm pack

# 2 Link core-ui into mswipe-erp new-solid-ui project (run from mswipe-erp\new-solid-ui)

Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue
Remove-Item node_modules\@solidxai -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item dist -Recurse -Force -ErrorAction SilentlyContinue

npm install "$env:USERPROFILE\Code\javascript\core-ui\solidstarters-core-ui-1.1.211.tgz"
npm run build



# 1 Build core-ui locally and pack it (run from core-ui, make sure dev branch is checked out)
sudo rm -rf node_modules;
sudo rm -rf dist;
sudo rm solidstarters-core-ui-1.1.211.tgz;

npm i;
npm run build;
npm pack;


# 2 Link core-ui into mswipe-erp new-solid-ui project (run from mswipe-erp\new-solid-ui)
sudo rm package-lock.json;
sudo rm -rf node_modules/@solidxai;
sudo rm -rf dist;

# make sure to change the path below to your local path where core-ui is located
npm i ~/Code/javascript/core-ui/solidstarters-core-ui-1.1.211.tgz;
npm run build;
