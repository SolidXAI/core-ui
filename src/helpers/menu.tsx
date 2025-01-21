const menu = {
  data: [
    {
      title: "Address Master",
      path: "/admin/address-master",
      key: 'address-master',
      icon: '/images/menu/address-master.svg',
      children: [
        {
          title: "Countries",
          path: "/admin/address-master/countries/all",
          key: 'address-master-countries',
          // children: [
          // ],
        },
        {
          title: "States",
          path: "/admin/address-master/states/all",
          key: 'address-master-states',
          // children: [],
        },
        {
          title: "Cities",
          path: "/admin/address-master/cities/all",
          key: 'address-master-cities',
          // children: [],
        },
        {
          title: "Pincodes",
          path: "/admin/address-master/pincodes/all",
          key: 'address-master-pincodes',
          // children: [],
        },
      ],
    },

    {
      title: "Iam",
      path: "/admin/iam",
      key: 'iam',
      icon: '/images/menu/iam.svg',
      children: [
        {
          title: "Users",
          path: "/admin/iam/users/all",
          key: 'iam-users',
          // children: [
          //   {
          //     title: "All",
          //     path: "/admin/iam/users/all",
          //     key: 'iam-users-all',
          //   },
          //   {
          //     title: "Saved Views",
          //     key: 'iam-users-saved-views',
          //     children: [
          //       {
          //         title: "Saved View 1 ",
          //         path: `/admin/iam/users/saved-views/${1}`,
          //         key: 'iam-users-saved-view-1'
          //       },
          //       {
          //         title: "Saved View 1 ",
          //         path: `/admin/iam/users/saved-views/${2}`,
          //         key: 'iam-users-saved-view-2'
          //       },
          //     ],
          //   },
          // ],
        },
        {
          title: "Roles",
          path: "/admin/iam/roles/all",
          key: 'iam-roles',
          children: [
            {
              title: "All",
              path: "/admin/iam/roles/all",
              key: 'iam-roles-all',
            },
            {
              title: "Saved Views",
              key: 'iam-roles-saved-views',
              children: [
                {
                  title: "Saved View 1 ",
                  path: `/admin/iam/roles/saved-views/${1}`,
                  key: 'iam-roles-saved-view-1'
                },
                {
                  title: "Saved View 1 ",
                  path: `/admin/iam/roles/saved-views/${2}`,
                  key: 'iam-roles-saved-view-2'
                },
              ],
            },
          ],
        },
        {
          title: "Permissions",
          path: "/admin/iam/permissions/all",
          key: 'iam-permissions',
          // children: [
          //   {
          //     title: "All",
          //     path: "/admin/iam/permissions/all",
          //     key: 'iam-permissions-all',
          //   },
          //   {
          //     title: "Saved Views",
          //     key: 'iam-permissions-saved-views',
          //     children: [
          //       {
          //         title: "Saved View 1 ",
          //         path: `/admin/iam/permissions/saved-views/${1}`,
          //         key: 'iam-permissions-saved-view-1'
          //       },
          //       {
          //         title: "Saved View 1 ",
          //         path: `/admin/iam/permissions/saved-views/${2}`,
          //         key: 'iam-permissions-saved-view-2'
          //       },
          //     ],
          //   },
          // ],
        },
      ],
    },
    {
      title: "App-builder",
      path: "/admin/app-builder",
      key: 'app-builder',
      icon: '/images/menu/app-builder.svg',
      children: [
        {
          title: "Module",
          path: "/admin/app-builder/module/all",
          key: 'app-builder-module',
          // children: [
          //   {
          //     title: "All",
          //     path: "/admin/app-builder/module/all",
          //     key: 'app-builder-module-all',
          //     children: [
          //       {
          //         title: "Grid View ",
          //         path: "/admin/app-builder/module/all",
          //       },
          //       {
          //         title: "Form View ",
          //         path: "/admin/app-builder/module/edit",
          //       },
          //     ],
          //   },
          //   {
          //     title: "Saved Views",
          //     path: "/admin/app-builder/module/saved-views/1",
          //     key: 'app-builder-module-saved-views',
          //     children: [
          //       {
          //         title: "Custome View 1 ",
          //         path: "/admin/app-builder/module/saved-views/1",
          //       },
          //       {
          //         title: "Custome View 2 ",
          //         path: "/admin/app-builder/module/saved-views/2",
          //       },
          //     ],
          //   },
          // ],
        },
        {
          title: "Model",
          path: "/admin/app-builder/model/all",
          key: 'app-builder-model',
          // children: [
          //   {
          //     title: "All",
          //     path: "/admin/app-builder/model/all",
          //     key: 'app-builder-model-all',
          //   },
          //   {
          //     title: "Saved Views",
          //     path: "/admin/app-builder/model/saved-views",
          //     key: 'app-builder-model-saved-views',
          //     children: [
          //       {
          //         title: "Custome View 1 ",
          //         path: "/admin/app-builder/model/saved-views/1",
          //       },
          //       {
          //         title: "Custome View 2 ",
          //         path: "/admin/app-builder/model/saved-views/1",
          //       },
          //     ],
          //   },
          // ],
        },
        {
          title: "Field",
          path: "/admin/app-builder/field/all",
          key: 'app-builder-field',
          // children: [
          //   {
          //     title: "All",
          //     path: "/admin/app-builder/field/all",
          //     key: 'app-builder-field-all',
          //     children: [
          //       {
          //         title: "Grid View ",
          //         path: "/admin/app-builder/field/all",
          //       },
          //       {
          //         title: "Form View ",
          //         path: "/admin/app-builder/field/edit",
          //       },
          //     ],
          //   },
          //   {
          //     title: "Saved Views",
          //     key: 'app-builder-field-saved-views',
          //     path: "/admin/app-builder/field/saved-views",
          //     children: [
          //       {
          //         title: "Custome View 1 ",
          //         path: "/admin/app-builder/field/saved-views/1",
          //       },
          //       {
          //         title: "Custome View 2 ",
          //         path: "/admin/app-builder/field/saved-views/1",
          //       },
          //     ],
          //   },
          // ],
        },
        {
          title: "Solid Menu",
          path: "/admin/app-builder/solid-menu/all",
          key: 'app-builder-solid-menus',
          // children: [
          //   {
          //     title: "All",
          //     path: "/admin/app-builder/solid-menus/all",
          //     key: 'app-builder-solid-menus-all',
          //     children: [
          //       {
          //         title: "Grid View ",
          //         path: "/admin/app-builder/solid-menus/all",
          //       },
          //       {
          //         title: "Form View ",
          //         path: "/admin/app-builder/solid-menus/edit",
          //       },
          //     ],
          //   },
          //   {
          //     title: "Saved Views",
          //     key: 'app-builder-solid-menus-saved-solid-menus',
          //     path: "/admin/app-builder/solid-menus/saved-solid-menus",
          //     children: [
          //       {
          //         title: "Custome View 1 ",
          //         path: "/admin/app-builder/solid-menus/saved-solid-menus/1",
          //       },
          //       {
          //         title: "Custome View 2 ",
          //         path: "/admin/app-builder/solid-menus/saved-solid-menus/1",
          //       },
          //     ],
          //   },
          // ],
        },
        {
          title: "Views",
          path: "/admin/app-builder/solid-view/all",
          key: 'app-builder-views',
          // children: [
          //   {
          //     title: "All",
          //     path: "/admin/app-builder/views/all",
          //     key: 'app-builder-views-all',
          //     children: [
          //       {
          //         title: "Grid View ",
          //         path: "/admin/app-builder/views/all",
          //       },
          //       {
          //         title: "Form View ",
          //         path: "/admin/app-builder/views/edit",
          //       },
          //     ],
          //   },
          //   {
          //     title: "Saved Views",
          //     key: 'app-builder-views-saved-views',
          //     path: "/admin/app-builder/views/saved-views",
          //     children: [
          //       {
          //         title: "Custome View 1 ",
          //         path: "/admin/app-builder/views/saved-views/1",
          //       },
          //       {
          //         title: "Custome View 2 ",
          //         path: "/admin/app-builder/views/saved-views/1",
          //       },
          //     ],
          //   },
          // ],
        },
        {
          title: "Actions",
          path: "/admin/app-builder/solid-action/all",
          key: 'app-builder-actions',
          // children: [
          //   {
          //     title: "All",
          //     path: "/admin/app-builder/actions/all",
          //     key: 'app-builder-actions-all',
          //     children: [
          //       {
          //         title: "Grid View ",
          //         path: "/admin/app-builder/actions/all",
          //       },
          //       {
          //         title: "Form View ",
          //         path: "/admin/app-builder/actions/edit",
          //       },
          //     ],
          //   },
          //   {
          //     title: "Saved Views",
          //     key: 'app-builder-actions-saved-actions',
          //     path: "/admin/app-builder/actions/saved-actions",
          //     children: [
          //       {
          //         title: "Custome View 1 ",
          //         path: "/admin/app-builder/actions/saved-actions/1",
          //       },
          //       {
          //         title: "Custome View 2 ",
          //         path: "/admin/app-builder/actions/saved-actions/1",
          //       },
          //     ],
          //   },
          // ],
        },
        {
          title: "Media Storage Provider",
          path: "/admin/app-builder/media-storage-provider/all",
          key: 'app-builder-media-storage-providers',
          // children: [
          //   {
          //     title: "All",
          //     path: "/admin/app-builder/media-storage-providers/all",
          //     key: 'app-builder-media-storage-providers-all',
          //     children: [
          //       {
          //         title: "Grid View ",
          //         path: "/admin/app-builder/media-storage-providers/all",
          //       },
          //       {
          //         title: "Form View ",
          //         path: "/admin/app-builder/media-storage-providers/edit",
          //       },
          //     ],
          //   },
          //   {
          //     title: "Saved Views",
          //     key: 'app-builder-media-storage-providers-saved-media-storage-providers',
          //     path: "/admin/app-builder/media-storage-providers/saved-media-storage-providers",
          //     children: [
          //       {
          //         title: "Custome View 1 ",
          //         path: "/admin/app-builder/media-storage-providers/saved-media-storage-providers/1",
          //       },
          //       {
          //         title: "Custome View 2 ",
          //         path: "/admin/app-builder/media-storage-providers/saved-media-storage-providers/1",
          //       },
          //     ],
          //   },
          // ],
        },
        {
          title: "Media",
          path: "/admin/app-builder/media/all",
          key: 'app-builder-medias',
          // children: [
          //   {
          //     title: "All",
          //     path: "/admin/app-builder/medias/all",
          //     key: 'app-builder-medias-all',
          //     children: [
          //       {
          //         title: "Grid View ",
          //         path: "/admin/app-builder/medias/all",
          //       },
          //       {
          //         title: "Form View ",
          //         path: "/admin/app-builder/medias/edit",
          //       },
          //     ],
          //   },
          //   {
          //     title: "Saved Views",
          //     key: 'app-builder-medias-saved-medias',
          //     path: "/admin/app-builder/medias/saved-medias",
          //     children: [
          //       {
          //         title: "Custome View 1 ",
          //         path: "/admin/app-builder/medias/saved-medias/1",
          //       },
          //       {
          //         title: "Custome View 2 ",
          //         path: "/admin/app-builder/medias/saved-medias/1",
          //       },
          //     ],
          //   },
          // ],
        },
      ],
    },
    {
      title: "Radix",
      path: "/admin/radix",
      key: 'radix',
      icon: '/images/menu/radix-logo.svg',
      children: [
        {
          title: "Menu",
          key: 'radix-menu',
          path: "/admin/radix/menu/all",
          // children: [
          //   {
          //     title: "All",
          //     path: "/admin/radix/menu/all",
          //     key: 'radix-menu-all',
          //   },
          //   {
          //     title: "Saved Views",
          //     key: 'radix-saved-views',
          //     children: [
          //       {
          //         title: "Saved View 1 ",
          //         path: `/admin/radix/menu/saved-views/${1}`,
          //         key: 'radix-menu-saved-view-1'
          //       },
          //       {
          //         title: "Saved View 1 ",
          //         path: `/admin/radix/menu/saved-views/${2}`,
          //         key: 'radix-menu-saved-view-2'
          //       },
          //     ],
          //   },
          // ],
        },
        {
          title: "Menu Item",
          path: "/admin/radix/menu-item/all",
          key: 'radix-menu-item',
          // children: [
          //   {
          //     title: "All",
          //     path: "/admin/radix/menu-item/all",
          //     key: 'radix-menu-item-all',
          //   },
          //   {
          //     title: "Saved Views",
          //     key: 'radix-menu-item-radix-saved-views',
          //     children: [
          //       {
          //         title: "Saved View 1 ",
          //         path: `/admin/radix/menu-item/saved-views/${1}`,
          //         key: 'radix-menu-item-saved-view-1'
          //       },
          //       {
          //         title: "Saved View 1 ",
          //         path: `/admin/radix/menu-item/saved-views/${2}`,
          //         key: 'radix-menu-item-saved-view-2'
          //       },
          //     ],
          //   },
          // ],
        },
        {
          title: "CMS Banner Image",
          path: "/admin/radix/cms-banner-image/all",
          key: 'radix-cms-banner-image',
          // children: [
          //   {
          //     title: "All",
          //     path: "/admin/radix/cms-banner-image/all",
          //     key: 'radix-cms-banner-image-all',
          //   },
          //   {
          //     title: "Saved Views",
          //     key: 'radix-cms-banner-image-saved-views',
          //     children: [
          //       {
          //         title: "Saved View 1 ",
          //         path: `/admin/radix/cms-banner-image/saved-views/${1}`,
          //         key: 'radix-cms-banner-image-saved-view-1'
          //       },
          //       {
          //         title: "Saved View 1 ",
          //         path: `/admin/radix/cms-banner-image/saved-views/${2}`,
          //         key: 'radix-cms-banner-image-saved-view-2'
          //       },
          //     ],
          //   },
          // ],
        },
        {
          title: "Article",
          path: "/admin/radix/article/all",
          key: 'radix-article',
          // children: [
          //   {
          //     title: "All",
          //     path: "/admin/radix/article/all",
          //     key: 'radix-article-all',
          //   },
          //   {
          //     title: "Saved Views",
          //     key: 'radix-article-saved-views',
          //     children: [
          //       {
          //         title: "Saved View 1 ",
          //         path: `/admin/radix/article/saved-views/${1}`,
          //         key: 'radix-article-saved-view-1'
          //       },
          //       {
          //         title: "Saved View 1 ",
          //         path: `/admin/radix/article/saved-views/${2}`,
          //         key: 'radix-article-saved-view-2'
          //       },
          //     ],
          //   },
          // ],
        },
        {
          title: "Category",
          path: "/admin/radix/category/all",
          key: 'radix-category',
          // children: [
          //   {
          //     title: "All",
          //     path: "/admin/radix/category/all",
          //     key: 'radix-category-all',
          //   },
          //   {
          //     title: "Saved Views",
          //     key: 'radix-category-saved-views',
          //     children: [
          //       {
          //         title: "Saved View 1 ",
          //         path: `/admin/radix/category/saved-views/${1}`,
          //         key: 'radix-category-saved-view-1'
          //       },
          //       {
          //         title: "Saved View 1 ",
          //         path: `/admin/radix/category/saved-views/${2}`,
          //         key: 'radix-category-saved-view-2'
          //       },
          //     ],
          //   },
          // ],
        },
        {
          title: "Tag Group",
          path: "/admin/radix/tag-group/all",
          key: 'radix-tag-group',
        },
        {
          title: "Tag",
          path: "/admin/radix/tag/all",
          key: 'radix-tag',
          // children: [
          //   {
          //     title: "All",
          //     path: "/admin/radix/tag/all",
          //     key: 'radix-tag-all',
          //   },
          //   {
          //     title: "Saved Views",
          //     key: 'radix-tag-saved-views',
          //     children: [
          //       {
          //         title: "Saved View 1 ",
          //         path: `/admin/radix/tag/saved-views/${1}`,
          //         key: 'radix-tag-saved-view-1'
          //       },
          //       {
          //         title: "Saved View 1 ",
          //         path: `/admin/radix/tag/saved-views/${2}`,
          //         key: 'radix-tag-saved-view-2'
          //       },
          //     ],
          //   },
          // ],
        },
        {
          title: "Automation",
          path: "/admin/radix/automation/all",
          key: 'radix-automation',
          // children: [
          //   {
          //     title: "All",
          //     path: "/admin/radix/automation/all",
          //     key: 'radix-automation-all',
          //   },
          //   {
          //     title: "Saved Views",
          //     key: 'radix-automation-saved-views',
          //     children: [
          //       {
          //         title: "Saved View 1 ",
          //         path: `/admin/radix/automation/saved-views/${1}`,
          //         key: 'radix-automation-saved-view-1'
          //       },
          //       {
          //         title: "Saved View 1 ",
          //         path: `/admin/radix/automation/saved-views/${2}`,
          //         key: 'radix-automation-saved-view-2'
          //       },
          //     ],
          //   },
          // ],
        },
        {
          title: "Radix Model Metadata",
          path: "/admin/radix/radix-model-metadata/all",
          key: 'radix-model-metadata',
          // children: [
          //   {
          //     title: "All",
          //     path: "/admin/radix/radix-model-metadata/all",
          //     key: 'radix-radix-model-metadata-all',
          //   },
          //   {
          //     title: "Saved Views",
          //     key: 'radix-radix-model-metadata-saved-views',
          //     children: [
          //       {
          //         title: "Saved View 1 ",
          //         path: `/admin/radix/radix-model-metadata/saved-views/${1}`,
          //         key: 'radix-radix-model-metadata-saved-view-1'
          //       },
          //       {
          //         title: "Saved View 1 ",
          //         path: `/admin/radix/radix-model-metadata/saved-views/${2}`,
          //         key: 'radix-radix-model-metadata-saved-view-2'
          //       },
          //     ],
          //   },
          // ],
        },
        {
          title: "Radix Model",
          path: "/admin/radix/radix-model/all",
          key: 'radix-model',
        }
      ]
    }
  ]
};

export default menu;

// moduleId=1&menuId
