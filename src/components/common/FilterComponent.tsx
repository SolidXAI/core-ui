// @ts-nocheck
"use client";
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Tooltip } from 'primereact/tooltip';
import React, { useState } from 'react';

enum FilterRuleType {
  RULE = 'rule',
  RULE_GROUP = 'rule_group'
}

enum FilterOperator {
  AND = 'and',
  OR = 'or'
}

enum FilterMatchMode {
  STARTS_WITH = 'startsWith',
  CONTAINS = 'contains',
  EQUALS = 'equals',
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
}

interface FilterRule {
  id: number;
  type: FilterRuleType;
  matchOperator?: FilterOperator;
  fieldName?: string;
  matchMode?: FilterMatchMode;
  value?: any;
  parentRule: number | null;
  children?: FilterRule[];
}

interface Field {
  name: string;
  type: 'string' | 'number' | 'date';
}

const fields: Field[] = [
  { name: 'name', type: 'string' },
  { name: 'dob', type: 'date' },
  { name: 'lastName', type: 'string' },
  { name: 'amount', type: 'number' }
];

const operatorOptions = {
  string: [FilterMatchMode.CONTAINS, FilterMatchMode.EQUALS],
  date: [FilterMatchMode.EQUALS, FilterMatchMode.GREATER_THAN, FilterMatchMode.LESS_THAN],
  number: [FilterMatchMode.GREATER_THAN, FilterMatchMode.LESS_THAN]
};

const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Component to render a single filter rule
const FilterRuleComponent = ({ rule, onChange, onAddRule, onAddGroup, onDelete, level }) => {
  const applicableOperators = rule.fieldName ? operatorOptions[fields.find(f => f.name === rule.fieldName)?.type].map(e => { return { name: e } }) : [];
  const applicableInputField = rule.fieldName ? fields.find(f => f.name === rule.fieldName)?.type : "";

  const [fieldName, setFieldName] = useState({ name: rule.fieldName });
  const [matchMode, setMatchMode] = useState({ name: rule.matchMode });

console.log("fields");
console.log(fields);


  return (
    // <div style={{ marginLeft: (level - 1) * 10 + 'px' }} className="filter-rule">
    <div style={{ marginLeft: 5 + 'px' }} className="filter-rule">
      <div className="filter-individual-rule">
        <div className='filter-individual-rule-form'>
          <div className="grid align-items-center">
            <div className="col-10">
              <div className="grid">
                <div className="col-4">
                  {/* <select
                    value={rule.fieldName || ''}
                    onChange={e => onChange(rule.id, 'fieldName', e.target.value)}
                  >
                    <option value="" disabled>Select Field</option>
                    {fields.map(field => (
                      <option key={field.name} value={field.name}>{field.name}</option>
                    ))}
                  </select> */}
                  <Dropdown
                    value={fieldName}
                    onChange={e => {
                      console.log("e.target");
                      console.log(e.target);
                      
                      setFieldName({ name: e.value.name , type: e.value.type})
                      onChange(rule.id, 'fieldName', e.value.name)
                    }}
                    options={fields}
                    optionLabel='name'
                    optionValue='name'
                    placeholder="Select Field" className="w-full md:w-14rem" />

                </div>
                <div className="col-4">
                  {/* <select
                    value={rule.matchMode || ''}
                    onChange={e => onChange(rule.id, 'matchMode', e.target.value)}
                    disabled={!rule.fieldName}
                  >
                    <option value="" disabled>Select Operator</option>
                    {applicableOperators.map(op => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select> */}
                  <Dropdown
                    value={matchMode}
                    onChange={e => {
                      setMatchMode({ name: e.value.name })
                      onChange(rule.id, 'matchMode', e.value.name)
                    }}
                    disabled={!rule.fieldName}
                    options={applicableOperators}
                    optionLabel='name'
                    optionValue='name'
                    placeholder="Select Field" className="w-full md:w-14rem" />

                </div>
                <div className="col-4">
                  {applicableInputField === 'number' && (
                    // <input
                    //   type="number"
                    //   value={rule.value || ''}
                    //   onChange={e => onChange(rule.id, 'value', e.target.value)}
                    //   placeholder="Value"
                    // />
                    <InputNumber
                      value={rule.value || ''}
                      placeholder="Value"
                      onChange={(e) => onChange(rule.id, 'value', e.value)}
                    />
                  )
                  }
                  {applicableInputField === 'string' && (
                    <InputText
                      value={rule.value || ''}
                      placeholder="Value"
                      onChange={(e) => onChange(rule.id, 'value', e.target.value)}
                    />
                  )
                  }
                  {applicableInputField === 'date' && (
                    // <InputText
                    //   value={rule.value || ''}
                    //   placeholder="Value"
                    //   onChange={(e) => onChange(rule.id, 'value', e.target.value)}
                    // />

                    <Calendar value={rule.value || ''} onChange={(e) => onChange(rule.id, 'value', new Date(e.value))}  dateFormat="dd/mm/yy" showIcon />
                  )
                  }
                </div>


              </div>
            </div>
            <div className="col-2 flex justify-content-end">
              <button onClick={() => onAddRule(rule.parentRule)}>
                <div className="card flex justify-content-center">
                  {/* <Tooltip target=".custom-target-icon" /> */}

                  <i className="custom-target-icon pi pi-plus-circle p-text-secondary p-overlay-badge"
                    data-pr-tooltip="Add Rule"
                    data-pr-position="right"
                    data-pr-at="right+5 top"
                    data-pr-my="left center-2"
                    style={{ fontSize: '1.2rem', cursor: 'pointer' }}>
                  </i>
                </div>


              </button>
              <button onClick={() => onAddGroup(rule.id)}>
                <div className="card flex justify-content-center">
                  {/* <Tooltip target=".custom-target-icon" /> */}

                  <i className="custom-target-icon pi pi-sitemap p-text-secondary p-overlay-badge"
                    data-pr-tooltip="Add Group"
                    data-pr-position="right"
                    data-pr-at="right+5 top"
                    data-pr-my="left center-2"
                    style={{ fontSize: '1.2rem', cursor: 'pointer' }}>
                  </i>
                </div>

              </button>

              <button onClick={() => onDelete(rule.id)}>
                <div className="card flex justify-content-center">
                  {/* <Tooltip target=".custom-target-icon" /> */}

                  <i className="custom-target-icon pi pi-trash p-text-secondary p-overlay-badge"
                    data-pr-tooltip="Delete Rule"
                    data-pr-position="right"
                    data-pr-at="right+5 top"
                    data-pr-my="left center-2"
                    style={{ fontSize: '1.2rem', cursor: 'pointer' }}>
                  </i>
                </div>
              </button>

            </div>

          </div>





        </div>

      </div>

      <div className="nested-rules">
        {rule.children && rule.children.map(nestedRule => (
          nestedRule.type === FilterRuleType.RULE
            ? <FilterRuleComponent key={nestedRule.id} rule={nestedRule} onChange={onChange} onAddRule={onAddRule} onAddGroup={onAddGroup} onDelete={onDelete} level={level + 1} />
            : <FilterGroupComponent key={nestedRule.id} group={nestedRule} onChange={onChange} onAddRule={onAddRule} onAddGroup={onAddGroup} onDelete={onDelete} level={level + 1} />
        ))}
      </div>
    </div>
  );
};

// Component to render a group of filter rules
const FilterGroupComponent = ({ group, onChange, onAddRule, onAddGroup, onDelete, level }) => {
  return (
    <div style={{ marginLeft: 5 + 'px' }} className="filter-group">
      {/* <div style={{ marginLeft: (level - 1) * 10 + 'px' }} className="filter-group"> */}

      <div className='flex justify-content-between align-items-center'>
        <p> Match
          <select className='filter-select'
            value={group.matchOperator}
            onChange={e => onChange(group.id, 'matchOperator', e.target.value)}
          >
            <option value={FilterOperator.AND}>AND</option>
            <option value={FilterOperator.OR}>OR</option>
          </select>
          of the following rules:</p>

        {/* <button onClick={() => onAddRule(group.id)}>Add Rule to Group</button> */}
        {/* <button onClick={() => onAddGroup(group.id)}>Add Group to Group</button> */}

        {/* Add Delete Button for non-root groups */}
        {level > 0 && <button onClick={() => onDelete(group.id)}>
          <div className="card flex justify-content-center">
            <Tooltip target=".custom-target-icon" />

            <i className="custom-target-icon pi pi-trash p-text-secondary p-overlay-badge"
              data-pr-tooltip="Delete Group"
              data-pr-position="right"
              data-pr-at="right+5 top"
              data-pr-my="left center-2"
              style={{ fontSize: '1.2rem', cursor: 'pointer' }}>
            </i>
          </div></button>}
      </div>
      {group.children && group.children.map(rule => (
        rule.type === FilterRuleType.RULE
          ? <FilterRuleComponent key={rule.id} rule={rule} onChange={onChange} onAddRule={onAddRule} onAddGroup={onAddGroup} onDelete={onDelete} level={level + 1} />
          : <FilterGroupComponent key={rule.id} group={rule} onChange={onChange} onAddRule={onAddRule} onAddGroup={onAddGroup} onDelete={onDelete} level={level + 1} />
      ))}
    </div>
  );
};

// Main Filter component
const FilterComponent = () => {
  const initialState: FilterRule[] = [
    {
      id: 1,
      type: FilterRuleType.RULE_GROUP,
      matchOperator: FilterOperator.OR,
      parentRule: null,
      children: [
        {
          id: Date.now() + getRandomInt(1, 500),
          type: FilterRuleType.RULE,
          fieldName: null,
          matchMode: null,
          value: null,
          parentRule: 1,
          children: []
        }
      ]
    }
  ];

  const [filterRules, setFilterRules] = useState<FilterRule[]>(initialState);
  const [printedState, setPrintedState] = useState<string>('');

  const addChild = (rules, parentId, newChild) => {
    return rules.map(rule => {
      if (rule.id === parentId) {
        return {
          ...rule,
          children: [...(rule.children || []), newChild]
        };
      } else if (rule.children) {
        return {
          ...rule,
          children: addChild(rule.children, parentId, newChild)
        };
      }
      return rule;
    });
  };

  const handleChange = (id, key, value) => {
    const updateRuleRecursively = (rules) => {
      return rules.map(rule => {
        if (rule.id === id) {
          return { ...rule, [key]: value };
        } else if (rule.children) {
          return {
            ...rule,
            children: updateRuleRecursively(rule.children)
          };
        }
        return rule;
      });
    };
    setFilterRules(prev => updateRuleRecursively(prev));
  };

  const handleAddRule = (parentGroupId) => {
    const newRule: FilterRule = {
      id: Date.now(),
      type: FilterRuleType.RULE,
      fieldName: null,
      matchMode: null,
      value: null,
      parentRule: parentGroupId,
      children: []
    };
    setFilterRules(prev => addChild(prev, parentGroupId, newRule));
  };

  const handleAddGroup = (parentRuleId) => {
    const newGroupId = Date.now();
    const newGroup: FilterRule = {
      id: newGroupId,
      type: FilterRuleType.RULE_GROUP,
      matchOperator: FilterOperator.AND,
      parentRule: parentRuleId,
      children: [
        {
          id: Date.now() + getRandomInt(1, 500),
          type: FilterRuleType.RULE,
          fieldName: null,
          matchMode: null,
          value: null,
          parentRule: newGroupId,
          children: []
        },
        {
          id: Date.now() + getRandomInt(1, 500),
          type: FilterRuleType.RULE,
          fieldName: null,
          matchMode: null,
          value: null,
          parentRule: newGroupId,
          children: []
        }
      ]
    };
    setFilterRules(prev => addChild(prev, parentRuleId, newGroup));
  };

  const handleDeleteRule = (id) => {
    const deleteRecursively = (rules, id) => {
      return rules.filter(rule => rule.id !== id).map(rule => {
        if (rule.children) {
          return {
            ...rule,
            children: deleteRecursively(rule.children, id)
          };
        }
        return rule;
      });
    };
    setFilterRules(prev => deleteRecursively(prev, id));
  };

  const handlePrintState = () => {
    setPrintedState(JSON.stringify(filterRules, null, 2)); // Pretty format the state
  };

  return (
    <div className=''>
      <div className="filter-builder">

        {filterRules.map(rule => (
          <FilterGroupComponent
            key={rule.id}
            group={rule}
            onChange={handleChange}
            onAddRule={handleAddRule}
            onAddGroup={handleAddGroup}
            onDelete={handleDeleteRule}
            level={0} // Top-level group
          />
        ))}

      </div>

      <div>
        <button onClick={handlePrintState}>Print State</button>
        <br></br>
        <textarea value={printedState} readOnly rows={20} cols={80} style={{ marginTop: '20px' }} />
      </div>
    </div>
  );
};

export default FilterComponent;