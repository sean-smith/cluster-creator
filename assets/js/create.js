// Click handler (jquery)

$(function() {

  // any config changes re-render the config file
  $("#options").change(function() {
    config()
	});

  // show the initial config file
  config();

  // download the config file
  function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
  }

  // click handler for download button
  $("#download").click(function() {
    button = $(this);
    config_yml = $("#code").text();
    download('pcluster.yml', config_yml);
  });
  
  // queues section of the config
  function queues (options){
    slurm_queues = []
    for (let i = 1; i < 6; i++) {
      if (i <= parseInt(options['num_queues'])) {
        $(`#queue_${i}`).show();
        slurm_queues.push({
          Name: options[`name_queue_${i}`],
          ComputeResources: {
            Name: options[`name_queue_${i}`],
            DisableSimultaneousMultithreading: options[`disable_hyperthreading_queue_${i}`],
            InstanceType: options[`instance_type_queue_${i}`],
            MinCount: options[`slider_queue_${i}_min`],
            MaxCount: options[`slider_queue_${i}_max`]
          }
        });
      } else {
        $(`#queue_${i}`).hide();
      }
    }

    return {
      Scheduler: 'slurm',
      SlurmQueues: slurm_queues
    }
  }

  // image section of the config
  function image (options){
    image_obj = {
      Os: options['Os']
    };
    options['CustomAmi_on'] ? image_obj['CustomAmi'] = options['CustomAmi'] : "";
    return image_obj;
  }

  // head node section of the config
  function head (options){
    return {
      InstanceType: options['head_node_instance_type'],
      DisableSimultaneousMultithreading: options['disable_hyperthreading'],
      Networking: {
        SubnetId: options['subnet_id'],
      },
      Ssh: {
        KeyName: options['key_name']
      },
      LocalStorage: {
        RootVolume: {
          Size: options['root_volume_size'],
        }
      }
    }
  }

  function storage(options){
    storage_obj = {}
    storage_obj['Name'] = options['shared_storage_type'];
    storage_obj['MountDir'] = options['mount_point'];
    storage_obj['StorageType'] = options['shared_storage_type'];

    switch (options['shared_storage_type']) {
      case 'FsxLustre':
        storage_obj['FsxLustreSettings'] = {
          StorageCapacity: options['fsx_capacity'],
          DeploymentType: options['fsx_type']
        };
        break;
      case 'Efs':
        break;
      case 'Ebs':
        break;
    }
    return storage_obj;
  }


  function config(){

    const options = new Map();

    $('.pcluster-option').each(function(i, obj) {
      id = $(obj).attr('id');
      obj = $(`#${id}`);
      switch (obj.attr('type')) {
        case 'min-max-slider':
          obj.slider({});
          options[`${id}_min`] = obj.val().split(',')[0];
          options[`${id}_max`] = obj.val().split(',')[1];
          break;
        case 'slider':
          obj.slider({});
          options[id] = obj.val();
          break;
        case 'checkbox':
          options[id] = obj.is(":checked");
          break;
        default:
          options[id] = obj.val();
          break;
      }
    });

    template_obj = {};

    template_obj['Image'] = image(options);
    template_obj['HeadNode'] = head(options);
    template_obj['Scheduling'] = queues(options)
    template_obj['SharedStorage'] = storage(options)

    $("#code").html(jsyaml.dump(template_obj));
      
  }


});
