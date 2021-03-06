import React from 'react';
import expect, { createSpy, restoreSpies } from 'expect';
import { mount } from 'enzyme';
import { noop } from 'lodash';

import { fillInFormInput } from 'test/helpers';
import targetMock from 'test/target_mock';
import QueryForm from './index';

const query = {
  id: 1,
  name: 'All users',
  description: 'Query to get all users',
  query: 'SELECT * FROM users',
};
const queryText = 'SELECT * FROM users';

describe('QueryForm - component', () => {
  beforeEach(targetMock);
  afterEach(restoreSpies);

  it('renders the base error', () => {
    const baseError = 'Unable to authenticate the current user';
    const formWithError = mount(<QueryForm serverErrors={{ base: baseError }} handleSubmit={noop} onTargetSelect={noop} />);
    const formWithoutError = mount(<QueryForm handleSubmit={noop} onTargetSelect={noop} />);

    expect(formWithError.text()).toInclude(baseError);
    expect(formWithoutError.text()).toNotInclude(baseError);
  });

  it('renders InputFields for the query name and description', () => {
    const form = mount(<QueryForm onTargetSelect={noop} query={query} queryText={queryText} />);
    const inputFields = form.find('InputField');

    expect(inputFields.length).toEqual(2);
    expect(inputFields.find({ name: 'name' }).length).toBeGreaterThan(0);
    expect(inputFields.find({ name: 'description' }).length).toBeGreaterThan(0);
  });

  it('validates the query name before saving changes', () => {
    const updateSpy = createSpy();
    const form = mount(<QueryForm formData={{ ...query, query: queryText }} onTargetSelect={noop} onUpdate={updateSpy} />);
    const inputFields = form.find('InputField');
    const nameInput = inputFields.find({ name: 'name' });

    fillInFormInput(nameInput, '');

    const saveDropButton = form.find('.query-form__save').hostNodes();

    saveDropButton.simulate('click');
    form.find('li').first().find('Button').simulate('click');

    expect(updateSpy).toNotHaveBeenCalled();
  });

  it('calls the handleSubmit prop when the form is valid', () => {
    const spy = createSpy();
    const form = mount(<QueryForm formData={{ ...query, query: queryText }} onTargetSelect={noop} onUpdate={spy} />);
    const inputFields = form.find('InputField');
    const nameInput = inputFields.find({ name: 'name' });

    fillInFormInput(nameInput, 'New query name');

    const saveDropButton = form.find('.query-form__save').hostNodes();

    saveDropButton.simulate('click');
    form.find('li').first().find('Button').simulate('click');

    expect(spy).toHaveBeenCalled({
      description: query.description,
      name: 'New query name',
      query: queryText,
    });
  });

  it('enables the Save Changes button when the name input changes', () => {
    const form = mount(<QueryForm formData={{ ...query, query: queryText }} onTargetSelect={noop} />);
    const inputFields = form.find('InputField');
    const nameInput = inputFields.find('input[name="name"]');
    let saveChangesOption = form.find('li.dropdown-button__option').first().find('Button');

    expect(saveChangesOption.props()).toInclude({
      disabled: true,
    });

    fillInFormInput(nameInput, 'New query name');
    nameInput.simulate('change', { target: { value: 'New query name' } });

    saveChangesOption = form.find('li.dropdown-button__option').first().find('Button');
    expect(saveChangesOption.props()).toNotInclude({
      disabled: true,
    });
  });

  it('enables the Save Changes button when the description input changes', () => {
    const form = mount(<QueryForm formData={{ ...query, query: queryText }} onTargetSelect={noop} />);
    const inputFields = form.find('InputField');
    const descriptionInput = inputFields.find({ name: 'description' });
    let saveChangesOption = form.find('li.dropdown-button__option').first().find('Button');

    expect(saveChangesOption.props()).toInclude({
      disabled: true,
    });

    fillInFormInput(descriptionInput, 'New query description');

    saveChangesOption = form.find('li.dropdown-button__option').first().find('Button');
    expect(saveChangesOption.props()).toNotInclude({
      disabled: true,
    });
  });

  it('calls the onSaveAsNew prop when "Save As New" is clicked and the form is valid', () => {
    const onSaveAsNewSpy = createSpy();
    const form = mount(<QueryForm formData={{ ...query, query: queryText }} handleSubmit={onSaveAsNewSpy} onTargetSelect={noop} />);
    const inputFields = form.find('InputField');
    const nameInput = inputFields.find({ name: 'name' });
    const saveAsNewOption = form.find('li.dropdown-button__option').last().find('Button');

    fillInFormInput(nameInput, 'New query name');

    saveAsNewOption.simulate('click');

    expect(onSaveAsNewSpy).toHaveBeenCalled();
    expect(onSaveAsNewSpy).toHaveBeenCalledWith({
      ...query,
      name: 'New query name',
      query: queryText,
    });
  });

  it('does not call the onSaveAsNew prop when "Save As New" is clicked and the form is not valid', () => {
    const onSaveAsNewSpy = createSpy();
    const form = mount(<QueryForm formData={{ ...query, query: queryText }} handleSubmit={onSaveAsNewSpy} onTargetSelect={noop} />);
    const inputFields = form.find('InputField');
    const nameInput = inputFields.find({ name: 'name' });
    const saveAsNewOption = form.find('li.dropdown-button__option').last().find('Button');

    fillInFormInput(nameInput, '');

    saveAsNewOption.simulate('click');

    expect(onSaveAsNewSpy).toNotHaveBeenCalled();
    expect(form.state()).toInclude({
      errors: {
        name: 'Title must be present',
        description: null,
      },
    });
  });
});
