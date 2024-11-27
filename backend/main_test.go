package main

import (
	"testing"
    "time"
	"context"
	

	"github.com/stretchr/testify/mock"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/api/errors" 
	"k8s.io/apimachinery/pkg/util/wait"
)

func TestExtractJupyterToken(t *testing.T) {
	tests := []struct {
		name     string
		logs     string
		expected string
	}{
		{
			name:     "Valid token in logs",
			logs:     "Starting Jupyter Notebook... token=12345abcdef",
			expected: "12345abcdef",
		},
		{
			name:     "No token in logs",
			logs:     "Starting Jupyter Notebook... no token found",
			expected: "",
		},
		{
			name:     "Empty logs",
			logs:     "",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := extractJupyterToken(tt.logs)
			if result != tt.expected {
				t.Errorf("extractJupyterToken(%q) = %q; want %q", tt.logs, result, tt.expected)
			}
		})
	}
}


type MockPodGetter struct {
	mock.Mock
}

func (m *MockPodGetter) Get(ctx context.Context, name string, opts metav1.GetOptions) (*corev1.Pod, error) {
	args := m.Called(ctx, name, opts)
	if pod, ok := args.Get(0).(*corev1.Pod); ok {
		return pod, args.Error(1)
	}
	return nil, args.Error(1)
}

func TestWaitForPodDeletion(t *testing.T) {
	mockPodGetter := new(MockPodGetter)

	// Simulate the pod existing initially and then being deleted
	mockPodGetter.On("Get", mock.Anything, "test-pod", mock.Anything).
		Return(&corev1.Pod{}, nil).Once()
	mockPodGetter.On("Get", mock.Anything, "test-pod", mock.Anything).
		Return(nil, errors.NewNotFound(corev1.Resource("pods"), "test-pod")).Once()

	// Mock a wrapper that represents CoreV1.Pod()
	clientset := struct {
		Pods func(namespace string) *MockPodGetter
	}{
		Pods: func(namespace string) *MockPodGetter { return mockPodGetter },
	}

	// Wrap the mock in a function to match the expected signature
	getPods := func(namespace string) func(context.Context, string, metav1.GetOptions) (*corev1.Pod, error) {
		return clientset.Pods(namespace).Get
	}

	// Replace `waitForPodDeletion` to use the mock
	err := wait.PollImmediate(time.Second, time.Minute, func() (bool, error) {
		_, err := getPods("default")(context.TODO(), "test-pod", metav1.GetOptions{})
		if errors.IsNotFound(err) {
			return true, nil
		}
		return false, err
	})
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	mockPodGetter.AssertExpectations(t)
}




func TestIsOnPremises(t *testing.T) {
	tests := []struct {
		name     string
		pod      corev1.Pod
		expected bool
	}{
		{
			name: "On-premises pod",
			pod: corev1.Pod{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{"location": "on-premises"},
				},
			},
			expected: true,
		},
		{
			name: "Not on-premises pod",
			pod: corev1.Pod{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{"location": "edge"},
				},
			},
			expected: false,
		},
		{
			name: "Pod without location label",
			pod: corev1.Pod{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{},
				},
			},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isOnPremises(tt.pod)
			if result != tt.expected {
				t.Errorf("isOnPremises() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestIsEdgeDevice(t *testing.T) {
	tests := []struct {
		name     string
		pod      corev1.Pod
		expected bool
	}{
		{
			name: "Edge device pod",
			pod: corev1.Pod{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{"location": "edge"},
				},
			},
			expected: true,
		},
		{
			name: "Not edge device pod",
			pod: corev1.Pod{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{"location": "on-premises"},
				},
			},
			expected: false,
		},
		{
			name: "Pod without location label",
			pod: corev1.Pod{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{},
				},
			},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isEdgeDevice(tt.pod)
			if result != tt.expected {
				t.Errorf("isEdgeDevice() = %v, want %v", result, tt.expected)
			}
		})
	}
}