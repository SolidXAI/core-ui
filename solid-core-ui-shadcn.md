# Queue List Layout Optimisations 

- [ ] see if we are able to control operator on any of the search fields
- [ ] saved filters on stages 
- [ ] saved filters on message broker 
- [ ] saved filters on today, yesterday, this week, this month, this year 
- [ ] predefined filters on message broker with a equals clause
- [ ] predefined filters on message broker with a starts with clause 
- [ ] enable sorting on started at, finished at & elapsed millis 
- [ ] can we make provision to enable sorting on the id, created at fields by default in solid core


# List View

- [x] row context menu fix
- [x] header context menu to be fixed. 
- [x] fix customize layout context menu 
- [x] delete dialog needs fixing 
- [x] fix save filter dialog
- [x] saved search is center aligned
- [ ] recover popup (test on a model with soft-delete enabled)
- [x] review pass to remove all references to primereact
- [ ] testing implementation of onBeforeTreeDataLoad & onTreeLoad using some solid core model
- [ ] testing implementation of imperative handle


# Kanban View 

- [x] header context menu to behave exactly like the one in the list view > see if we can convert to a single re-usable component across list & kanban
- [ ] media to be support kanban view with image rendering 
- [x] add support for custom card widget when rendering kanban view 
- [ ] see if we can refactor the cogwheel component as a re-usable one for list, tree & kanban.
- [x] viewmodes is not coming populating on the kanban view layout api call...
- [ ] kanban refresh does a full page refresh?
- [x] kanban scroll is not working
- [x] remove all references / code around ungrouped mode in the kanban view.
- [ ] introduce events onKanbanBoardLoad, onBeforeKanbanBoardDataLoad, onKanbanSwimlaneBeforeDataLoad, onKanbanSwimlaneDataLoad
- [ ] testing implementation of onKanbanBoardLoad, onBeforeKanbanBoardDataLoad, onKanbanSwimlaneBeforeDataLoad, onKanbanSwimlaneDataLoad using some solid core model
- [ ] add support for imperative handle
- [ ] testing implementation of imperative handle


# Tree View

- [ ] harish
- [ ] testing implementation of onBeforeTreeDataLoad & onTreeLoad using some solid core model
- [ ] add support for imperative handle
- [ ] testing implementation of imperative handle


# Card View 

- [x] scroll is not working
- [ ] bottom pagination to be like list view RHS and more compact.
- [ ] introduce events onCardLayoutLoad, onBeforeCardLayoutDataLoad
- [ ] testing implementation of onCardLayoutLoad, onBeforeCardLayoutDataLoad using some solid core model
- [ ] add support for imperative handle
- [ ] testing implementation of imperative handle


# Import 

# Export 

- [ ] move control pane to the bottom

# Chatter

- [ ] jenendar

# Form View 

- [x] wrapper like we have in list view 
- [x] workflow field stepper to be improved
- [ ] rich text field alternative
- [ ] bottom pagination / navigation not working when we open form view from anything other than list view
- [ ] testing implementations of all types of form events
- [ ] testing implementations of a custom widget

# General 

- [ ] light box primitive (ref: mswipe)
    - [ ] media single list & form view to use this new primitive 
    - [ ] chatter log note to use this new primitive 
    - [ ] media card to use this primitive
- [ ] fix the account settings context menu 
- [x] registry.ts we can make the registerExtensionComponent > type not default to null 
- [x] registry.ts we can make the registerExtensionFunction > carry a type field to control the types of extension functions that we support by introducing a new type whose values are as follows ...  not default to null 
- [ ] cleanup and remove all references of old json editor replacing it with the one we are using in dashboard for sql editor (monaco editor)
- [x] rich text editor using https://github.com/htmujahid/shadcn-editor
- [x] cleanup spinner, remove shimer 
- [ ] cleanup toast 
- [ ] backend studio landing page
- [ ] core user interfaces 
    - [ ] module form view 
    - [ ] generate module 
    - [ ] delete module
    - [ ] model form view > field popups 
    - [ ] generate model 
    - [ ] delete model
    - [ ] user form view 
- [ ] command palette (cmd-p) for global navigation
- [ ] command palette (cmd-shift-p) for view specific commands 


# Cleanup run
- [ ] remove all references of prime react from eveywhere 
- [ ] check if there is scope to review the code and come up with primitives that might be useful 
- [ ] check for component duplication and refactor 
