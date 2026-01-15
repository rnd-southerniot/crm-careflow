import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DynamicFormRenderer from './DynamicFormRenderer';

// Mock the UI components
jest.mock('@/components/ui/input', () => ({
  Input: ({ ...props }: any) => <input data-testid="input" {...props} />
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ ...props }: any) => <textarea data-testid="textarea" {...props} />
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      data-testid="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  )
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange }: any) => (
    <div data-testid="select-container">{children}</div>
  ),
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <span data-testid="select-value">{placeholder}</span>,
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ value, children }: any) => (
    <option data-testid="select-item" value={value}>{children}</option>
  )
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => (
    <button data-testid="button" {...props}>{children}</button>
  )
}));

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: any) => <div data-testid="popover">{children}</div>,
  PopoverTrigger: ({ children }: any) => <div data-testid="popover-trigger">{children}</div>,
  PopoverContent: ({ children }: any) => <div data-testid="popover-content">{children}</div>
}));

jest.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect, selected }: any) => (
    <div data-testid="calendar" onClick={() => onSelect?.(new Date('2024-01-15'))}>
      Calendar Mock
    </div>
  )
}));

jest.mock('./Label', () => {
  return function Label({ text, isRequired }: any) {
    return (
      <label data-testid="label">
        {text}
        {isRequired && <span data-testid="required-indicator">*</span>}
      </label>
    );
  };
});

jest.mock('./ErrorText', () => {
  return function ErrorText({ text }: any) {
    return <span data-testid="error-text">{text}</span>;
  };
});

describe('DynamicFormRenderer', () => {
  const mockSchema = {
    id: 'test-schema',
    productId: 'test-product',
    version: 1,
    formStructure: [
      {
        id: 'field-1',
        name: 'testText',
        label: 'Test Text Field',
        type: 'text' as const,
        required: true,
        order: 1
      },
      {
        id: 'field-2',
        name: 'testNumber',
        label: 'Test Number Field',
        type: 'number' as const,
        required: false,
        validation: [
          {
            type: 'min' as const,
            value: 0,
            message: 'Must be positive'
          }
        ],
        order: 2
      },
      {
        id: 'field-3',
        name: 'testSelect',
        label: 'Test Select Field',
        type: 'select' as const,
        required: true,
        options: [
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' }
        ],
        order: 3
      }
    ]
  };

  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders all field types correctly', () => {
    render(<DynamicFormRenderer schema={mockSchema} onSubmit={mockOnSubmit} />);

    // Check that labels are rendered
    expect(screen.getByText('Test Text Field')).toBeInTheDocument();
    expect(screen.getByText('Test Number Field')).toBeInTheDocument();
    expect(screen.getByText('Test Select Field')).toBeInTheDocument();

    // Check that required indicators are shown
    const requiredIndicators = screen.getAllByTestId('required-indicator');
    expect(requiredIndicators).toHaveLength(2); // text and select fields are required

    // Check that form elements are rendered
    expect(screen.getByTestId('input')).toBeInTheDocument();
    expect(screen.getByTestId('select-container')).toBeInTheDocument();
  });

  it('displays initial data correctly', () => {
    const initialData = {
      testText: 'Initial text value',
      testNumber: 42
    };

    render(
      <DynamicFormRenderer
        schema={mockSchema}
        onSubmit={mockOnSubmit}
        initialData={initialData}
      />
    );

    const textInput = screen.getByTestId('input');
    expect(textInput).toHaveValue('Initial text value');
  });

  it('sorts fields by order', () => {
    const unorderedSchema = {
      ...mockSchema,
      formStructure: [
        { ...mockSchema.formStructure[2], order: 1 }, // select field first
        { ...mockSchema.formStructure[0], order: 2 }, // text field second
        { ...mockSchema.formStructure[1], order: 3 }  // number field third
      ]
    };

    render(<DynamicFormRenderer schema={unorderedSchema} onSubmit={mockOnSubmit} />);

    const labels = screen.getAllByTestId('label');
    expect(labels[0]).toHaveTextContent('Test Select Field');
    expect(labels[1]).toHaveTextContent('Test Text Field');
    expect(labels[2]).toHaveTextContent('Test Number Field');
  });

  it('renders submit button', () => {
    render(<DynamicFormRenderer schema={mockSchema} onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByTestId('button');
    expect(submitButton).toHaveTextContent('Submit Report');
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('shows loading state', () => {
    render(
      <DynamicFormRenderer
        schema={mockSchema}
        onSubmit={mockOnSubmit}
        isLoading={true}
      />
    );

    const submitButton = screen.getByTestId('button');
    expect(submitButton).toHaveTextContent('Submitting...');
    expect(submitButton).toBeDisabled();
  });

  it('handles checkbox field type', () => {
    const checkboxSchema = {
      ...mockSchema,
      formStructure: [
        {
          id: 'field-checkbox',
          name: 'testCheckbox',
          label: 'Test Checkbox',
          type: 'checkbox' as const,
          required: false,
          order: 1
        }
      ]
    };

    render(<DynamicFormRenderer schema={checkboxSchema} onSubmit={mockOnSubmit} />);

    expect(screen.getByTestId('checkbox')).toBeInTheDocument();
    expect(screen.getByText('Test Checkbox')).toBeInTheDocument();
  });

  it('handles textarea field type', () => {
    const textareaSchema = {
      ...mockSchema,
      formStructure: [
        {
          id: 'field-textarea',
          name: 'testTextarea',
          label: 'Test Textarea',
          type: 'textarea' as const,
          required: false,
          order: 1
        }
      ]
    };

    render(<DynamicFormRenderer schema={textareaSchema} onSubmit={mockOnSubmit} />);

    expect(screen.getByTestId('textarea')).toBeInTheDocument();
    expect(screen.getByText('Test Textarea')).toBeInTheDocument();
  });

  it('handles date field type', () => {
    const dateSchema = {
      ...mockSchema,
      formStructure: [
        {
          id: 'field-date',
          name: 'testDate',
          label: 'Test Date',
          type: 'date' as const,
          required: false,
          order: 1
        }
      ]
    };

    render(<DynamicFormRenderer schema={dateSchema} onSubmit={mockOnSubmit} />);

    expect(screen.getByTestId('popover')).toBeInTheDocument();
    expect(screen.getByText('Test Date')).toBeInTheDocument();
  });
});